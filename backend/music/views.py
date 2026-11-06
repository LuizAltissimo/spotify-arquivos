from collections import Counter
from datetime import timedelta, timezone as datetime_timezone
from django.conf import settings
from django.core.cache import cache
from django.db.models import Count, Sum, Q
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view
from .models import ImportBatch, Playback, SourceFile
from .selectors import selected_period, ranking
from .importer import configured_data_dir


def page_number(params):
    try:
        return max(1, min(int(params.get("page", "1")), 100000))
    except (TypeError, ValueError):
        raise ValueError("Número de página inválido.")


@api_view(["GET"])
def health(request):
    return JsonResponse(
        {"ok": True, "timezone": settings.TIME_ZONE, "events": Playback.objects.count()}
    )


@api_view(["GET"])
def overview(request):
    try:
        qs, start, end, period = selected_period(request.query_params)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    cache_key = f"overview:{period}:{start}:{end}"
    data = cache.get(cache_key)
    if data is None:
        agg = qs.aggregate(plays=Count("id"), time_ms=Sum("duration_ms"))
        rows = list(
            qs.values(
                "played_at",
                "track_uri",
                "track_name",
                "artist_name",
                "album_name",
                "duration_ms",
            )
        )
        dates = [timezone.localtime(row["played_at"]).date() for row in rows]
        days = Counter(dates)
        hours = Counter(timezone.localtime(row["played_at"]).hour for row in rows)
        weekdays = Counter(
            timezone.localtime(row["played_at"]).weekday() for row in rows
        )
        daily_time = Counter()
        for row in rows:
            daily_time[timezone.localtime(row["played_at"]).date()] += row[
                "duration_ms"
            ]
        sorted_days = sorted(days)
        longest = current = 0
        previous = None
        for day in sorted_days:
            current = current + 1 if previous and (day - previous).days == 1 else 1
            longest = max(longest, current)
            previous = day
        tracks = Counter(
            (r["track_uri"] or r["track_name"], r["track_name"], r["artist_name"])
            for r in rows
            if r["track_uri"] or r["track_name"]
        )
        artists = Counter(r["artist_name"] for r in rows if r["artist_name"])
        albums = Counter(
            (r["album_name"], r["artist_name"]) for r in rows if r["album_name"]
        )
        year_counts = Counter(d.year for d in dates)
        all_music = Playback.objects.filter(media_type="music")
        today = timezone.localdate()
        lower = start or (min(dates) if dates else today)
        upper = (end - timedelta(days=1)) if end else (max(dates) if dates else today)
        days_in_period = max(1, (upper - lower).days + 1)
        months = max(1, (upper.year - lower.year) * 12 + upper.month - lower.month + 1)
        top_track = tracks.most_common(1)[0] if tracks else None
        top_artist = artists.most_common(1)[0] if artists else None
        top_album = albums.most_common(1)[0] if albums else None
        data = {
            "period": period,
            "timezone": settings.TIME_ZONE,
            "from": start.isoformat() if start else None,
            "to": (end - timedelta(days=1)).isoformat() if end else None,
            "plays": agg["plays"] or 0,
            "time_ms": agg["time_ms"] or 0,
            "minutes": round((agg["time_ms"] or 0) / 60000, 1),
            "unique_tracks": qs.exclude(track_uri="")
            .values("track_uri")
            .distinct()
            .count()
            + qs.filter(track_uri="")
            .exclude(track_name="")
            .values("track_name", "artist_name")
            .distinct()
            .count(),
            "unique_artists": qs.exclude(artist_name="")
            .values("artist_name")
            .distinct()
            .count(),
            "unique_albums": qs.exclude(album_name="")
            .values("album_name", "artist_name")
            .distinct()
            .count(),
            "all_time_artists": all_music.exclude(artist_name="")
            .values("artist_name")
            .distinct()
            .count(),
            "top_track": (
                {
                    "name": top_track[0][1],
                    "artist": top_track[0][2],
                    "plays": top_track[1],
                }
                if top_track
                else None
            ),
            "top_artist": (
                {"name": top_artist[0], "plays": top_artist[1]} if top_artist else None
            ),
            "top_album": (
                {
                    "name": top_album[0][0],
                    "artist": top_album[0][1],
                    "plays": top_album[1],
                }
                if top_album
                else None
            ),
            "top_tracks": [
                {"name": key[1], "artist": key[2], "plays": plays}
                for key, plays in tracks.most_common(5)
            ],
            "top_artists": [
                {"name": name, "plays": plays} for name, plays in artists.most_common(5)
            ],
            "top_albums": [
                {"name": key[0], "artist": key[1], "plays": plays}
                for key, plays in albums.most_common(5)
            ],
            "peak_day": (
                {
                    "date": max(
                        days, key=lambda d: (days[d], d.isoformat())
                    ).isoformat(),
                    "plays": max(days.values()),
                }
                if days
                else None
            ),
            "peak_hour": (
                {
                    "hour": max(hours, key=lambda h: (hours[h], -h)),
                    "plays": max(hours.values()),
                }
                if hours
                else None
            ),
            "daily_average": round((agg["plays"] or 0) / days_in_period, 2),
            "monthly_average": round((agg["plays"] or 0) / months, 1),
            "longest_streak": longest,
            "daily": [{"date": d.isoformat(), "plays": days[d]} for d in sorted_days],
            "years": [
                {"year": y, "plays": year_counts[y]} for y in sorted(year_counts)
            ],
            "hours": [{"hour": h, "plays": hours[h]} for h in range(24)],
            "weekdays": [{"weekday": d, "plays": weekdays[d]} for d in range(7)],
            "genres": [],
            "genres_available": False,
            "genre_note": "Os arquivos do histórico não contêm gêneros; nenhum gênero foi inferido.",
        }
        data["daily"] = [
            {"date": d.isoformat(), "plays": days[d], "time_ms": daily_time[d]}
            for d in sorted_days
        ]
        cache.set(cache_key, data, 300)
    return JsonResponse(data)


@api_view(["GET"])
def history(request):
    try:
        qs, *_ = selected_period(request.query_params)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    try:
        page = page_number(request.query_params)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    size = 50
    for parameter, field in (("artist", "artist_name"), ("album", "album_name")):
        value = request.query_params.get(parameter)
        if value:
            qs = qs.filter(**{f"{field}__icontains": value[:120]})
    track_term = request.query_params.get("track", "").strip()[:120]
    if track_term:
        qs = qs.filter(
            Q(track_name__icontains=track_term)
            | Q(artist_name__icontains=track_term)
            | Q(album_name__icontains=track_term)
        )
    skipped = request.query_params.get("skipped")
    if skipped in ("true", "false"):
        qs = qs.filter(skipped=(skipped == "true"))
    count = qs.count()
    rows = qs.order_by("-played_at").values(
        "played_at",
        "duration_ms",
        "track_name",
        "artist_name",
        "album_name",
        "track_uri",
        "skipped",
        "platform",
    )[(page - 1) * size : page * size]
    return JsonResponse(
        {
            "results": list(rows),
            "count": count,
            "page": page,
            "page_size": size,
            "has_next": page * size < count,
        }
    )


@api_view(["GET"])
def rankings(request, entity):
    try:
        qs, *_ = selected_period(request.query_params)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    if entity not in ("tracks", "artists", "albums"):
        return JsonResponse({"error": "Ranking desconhecido"}, status=404)
    try:
        page = page_number(request.query_params)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    size = 30
    sort_by = request.query_params.get("sort", "plays")
    if sort_by not in ("plays", "time"):
        return JsonResponse({"error": "Ordenação inválida."}, status=400)
    term = request.query_params.get("q", "").strip()[:120]
    if term:
        fields = {
            "tracks": ("track_name", "artist_name", "album_name"),
            "artists": ("artist_name",),
            "albums": ("album_name", "artist_name"),
        }[entity]
        search = Q()
        for field in fields:
            search |= Q(**{f"{field}__icontains": term})
        qs = qs.filter(search)
    rows, count = ranking(qs, entity, page, size, sort_by)
    return JsonResponse(
        {
            "results": rows,
            "page": page,
            "page_size": size,
            "count": count,
            "has_next": page * size < count,
            "sort": sort_by,
        }
    )


@api_view(["GET"])
def imports_status(request):
    batch = ImportBatch.objects.order_by("-started_at").first()
    latest = (
        {
            "started_at": batch.started_at,
            "finished_at": batch.finished_at,
            "files_found": batch.files_found,
            "files_read": batch.files_read,
            "files_ignored": batch.files_ignored,
            "records_read": batch.records_read,
            "records_created": batch.records_created,
            "records_duplicate": batch.records_duplicate,
            "records_invalid": batch.records_invalid,
            "errors": batch.errors,
        }
        if batch
        else None
    )
    recent = [
        {
            "started_at": b.started_at,
            "finished_at": b.finished_at,
            "files_found": b.files_found,
            "files_read": b.files_read,
            "files_ignored": b.files_ignored,
            "records_read": b.records_read,
            "records_created": b.records_created,
            "records_duplicate": b.records_duplicate,
            "records_invalid": b.records_invalid,
            "errors": b.errors,
        }
        for b in ImportBatch.objects.order_by("-started_at")[:10]
    ]
    files = [
        {
            "name": f.relative_path,
            "size_bytes": f.size_bytes,
            "modified_at": f.modified_at,
            "processed_at": f.processed_at,
            "records_read": f.records_read,
            "result": f.result,
            "error": f.last_error,
        }
        for f in SourceFile.objects.order_by("relative_path")
    ]
    return JsonResponse(
        {
            "files": SourceFile.objects.count(),
            "file_details": files,
            "events": Playback.objects.count(),
            "last_batch": latest,
            "recent_batches": recent,
        }
    )


@api_view(["GET"])
def comparisons(request):
    try:
        current, start, end, period = selected_period(request.query_params)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)
    if period == "all" or not start:
        return JsonResponse(
            {
                "available": False,
                "reason": "A comparação precisa de um período com início definido.",
            }
        )
    now = timezone.localdate()
    end_day = end or now + timedelta(days=1)
    span = max(1, (end_day - start).days)
    previous_start = start - timedelta(days=span)
    previous = Playback.objects.filter(
        media_type="music",
        played_at__date__gte=previous_start,
        played_at__date__lt=start,
    )
    current_stats = current.aggregate(plays=Count("id"), time_ms=Sum("duration_ms"))
    previous_stats = previous.aggregate(plays=Count("id"), time_ms=Sum("duration_ms"))
    return JsonResponse(
        {
            "available": True,
            "current": {
                "from": start.isoformat(),
                "to": (end_day - timedelta(days=1)).isoformat(),
                "plays": current_stats["plays"] or 0,
                "time_ms": current_stats["time_ms"] or 0,
            },
            "previous": {
                "from": previous_start.isoformat(),
                "to": (start - timedelta(days=1)).isoformat(),
                "plays": previous_stats["plays"] or 0,
                "time_ms": previous_stats["time_ms"] or 0,
            },
            "period_days": span,
        }
    )


@api_view(["POST"])
def scan_import(request):
    root = configured_data_dir()
    if not root.exists() or not root.is_dir():
        return JsonResponse(
            {"error": "O diretório de dados configurado não existe."}, status=400
        )
    from .importer import file_hash, iter_json_array
    from .services import normalize_event, invalidate_stats_cache

    batch = ImportBatch.objects.create()
    files = sorted(
        p for p in root.glob("*.json") if p.is_file() and p.resolve().parent == root
    )
    batch.files_found = len(files)
    batch.save(update_fields=["files_found"])
    for path in files:
        source, _ = SourceFile.objects.get_or_create(relative_path=path.name)
        digest = file_hash(path)
        stat = path.stat()
        if source.result == "success" and source.sha256 == digest:
            batch.files_ignored += 1
            continue
        source.size_bytes = stat.st_size
        source.modified_at = timezone.datetime.fromtimestamp(
            stat.st_mtime, tz=datetime_timezone.utc
        )
        source.sha256 = digest
        source.last_error = ""
        source.result = "pending"
        source.save()
        read_count = created = duplicates = 0
        pending = []
        try:
            invalid = 0
            for item in iter_json_array(path):
                read_count += 1
                event = normalize_event(item, source, batch)
                if event:
                    pending.append(event)
                else:
                    invalid += 1
                if len(pending) >= 1000:
                    added, repeated = insert_unique_events(pending)
                    created += added
                    duplicates += repeated
                    pending = []
            if pending:
                added, repeated = insert_unique_events(pending)
                created += added
                duplicates += repeated
            source.records_read = read_count
            source.processed_at = timezone.now()
            source.result = "success"
            source.save()
            batch.files_read += 1
            batch.records_read += read_count
            batch.records_created += created
            batch.records_duplicate += duplicates
            batch.records_invalid += invalid
        except (OSError, ValueError, UnicodeError) as error:
            message = (
                "Não foi possível ler o arquivo; verifique se o JSON está acessível."
                if isinstance(error, OSError)
                else (
                    "O arquivo não está em JSON UTF-8 válido."
                    if isinstance(error, UnicodeError)
                    else str(error)
                )
            )
            source.result = "error"
            source.last_error = message[:240]
            source.processed_at = timezone.now()
            source.save()
            batch.files_ignored += 1
            batch.errors.append({"file": path.name, "message": message[:180]})
    batch.finished_at = timezone.now()
    batch.save()
    if batch.records_created:
        invalidate_stats_cache()
    return JsonResponse(
        {
            "files_found": batch.files_found,
            "files_read": batch.files_read,
            "files_ignored": batch.files_ignored,
            "records_read": batch.records_read,
            "records_created": batch.records_created,
            "records_duplicate": batch.records_duplicate,
            "records_invalid": batch.records_invalid,
            "errors": batch.errors,
        }
    )


def insert_unique_events(events):
    from .models import Playback

    unique = {event.event_key: event for event in events}
    keys = list(unique)
    existing = set()
    for offset in range(0, len(keys), 500):
        existing.update(
            Playback.objects.filter(
                event_key__in=keys[offset : offset + 500]
            ).values_list("event_key", flat=True)
        )
    new = [event for key, event in unique.items() if key not in existing]
    duplicates = len(events) - len(new)
    if new:
        Playback.objects.bulk_create(new, ignore_conflicts=True, batch_size=500)
    return len(new), duplicates
