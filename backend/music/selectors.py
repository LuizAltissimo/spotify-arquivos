from datetime import date, timedelta
import calendar
from django.db.models import Count, Sum
from django.utils import timezone
from .models import Playback


def selected_period(params):
    now = timezone.localtime()
    period = params.get("period", "all")
    if period not in (
        "7d",
        "30d",
        "3m",
        "6m",
        "this-year",
        "last-year",
        "custom",
        "all",
    ):
        raise ValueError("Período inválido.")
    end = None
    if period == "7d":
        start = now.date() - timedelta(days=6)
        end = now.date() + timedelta(days=1)
    elif period == "30d":
        start = now.date() - timedelta(days=29)
        end = now.date() + timedelta(days=1)
    elif period == "3m":
        start = subtract_months(now.date(), 3)
        end = now.date() + timedelta(days=1)
    elif period == "6m":
        start = subtract_months(now.date(), 6)
        end = now.date() + timedelta(days=1)
    elif period == "this-year":
        start = date(now.year, 1, 1)
        end = now.date() + timedelta(days=1)
    elif period == "last-year":
        start = date(now.year - 1, 1, 1)
    elif period == "custom":
        try:
            start = date.fromisoformat(params["from"])
            end_date = date.fromisoformat(params["to"])
        except (KeyError, ValueError):
            raise ValueError(
                "Informe as datas inicial e final do intervalo personalizado."
            )
        if end_date < start:
            raise ValueError("A data final deve ser igual ou posterior à data inicial.")
        end = end_date + timedelta(days=1)
    else:
        start = None
    if period == "last-year":
        end = date(now.year, 1, 1)
    qs = Playback.objects.filter(media_type="music")
    if start:
        qs = qs.filter(played_at__date__gte=start)
    if end:
        qs = qs.filter(played_at__date__lt=end)
    return qs, start, end, period


def subtract_months(value, months):
    index = value.year * 12 + value.month - 1 - months
    year, month = divmod(index, 12)
    month += 1
    return date(year, month, min(value.day, calendar.monthrange(year, month)[1]))


def ranking(qs, entity, page=1, page_size=30, sort_by="plays"):
    groups = {
        "tracks": ("track_uri", "track_name", "artist_name"),
        "artists": ("artist_name",),
        "albums": ("album_name", "artist_name"),
    }
    fields = groups[entity]
    order_field = "time_ms" if sort_by == "time" else "plays"
    rows = (
        qs.exclude(**{f"{fields[0]}__exact": ""})
        .values(*fields)
        .annotate(
            plays=Count("id"),
            time_ms=Sum("duration_ms"),
            unique_tracks=Count("track_uri", distinct=True),
        )
        .order_by(f"-{order_field}", *fields)
    )
    count = rows.count()
    return list(rows[(page - 1) * page_size : page * page_size]), count
