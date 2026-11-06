import hashlib
import json
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from .models import Playback


def parse_timestamp(value):
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        if timezone.is_naive(parsed):
            parsed = parsed.replace(tzinfo=dt_timezone.utc)
        return parsed
    except (ValueError, TypeError, OverflowError):
        return None


def normalize_event(row, source, batch):
    if not isinstance(row, dict):
        return None
    stamp = row.get("ts") or row.get("endTime")
    played_at = parse_timestamp(stamp)
    if not played_at:
        return None
    uri = row.get("spotify_track_uri") or row.get("track_uri") or ""
    track_name = row.get("master_metadata_track_name") or row.get("track_name") or ""
    artist = (
        row.get("master_metadata_album_artist_name") or row.get("artist_name") or ""
    )
    album = row.get("master_metadata_album_album_name") or row.get("album_name") or ""
    episode_uri = row.get("spotify_episode_uri") or row.get("episode_uri") or ""
    media = (
        "music"
        if uri or track_name or artist
        else (
            "episode"
            if episode_uri or row.get("episode_name") or row.get("episode_show_name")
            else "other"
        )
    )
    stable = {k: v for k, v in row.items() if k != "ip_addr"}
    key = hashlib.sha256(
        json.dumps(
            stable,
            sort_keys=True,
            ensure_ascii=False,
            separators=(",", ":"),
            default=str,
        ).encode()
    ).hexdigest()
    duration = row.get("ms_played", row.get("msPlayed", 0))
    try:
        duration = max(0, int(duration or 0))
    except (ValueError, TypeError, OverflowError):
        duration = 0
    original = {k: v for k, v in row.items() if k != "ip_addr"}
    return Playback(
        source_file=source,
        batch=batch,
        event_key=key,
        played_at=played_at,
        original_timestamp=str(stamp)[:80],
        duration_ms=duration,
        media_type=media,
        track_uri=str(uri)[:240],
        track_name=str(track_name)[:500],
        artist_name=str(artist)[:500],
        album_name=str(album)[:500],
        episode_name=str(row.get("episode_name") or row.get("episode_show_name") or "")[
            :500
        ],
        episode_uri=str(episode_uri)[:240],
        skipped=row.get("skipped") if isinstance(row.get("skipped"), bool) else None,
        shuffle=row.get("shuffle") if isinstance(row.get("shuffle"), bool) else None,
        platform=str(row.get("platform") or "")[:160],
        reason_start=str(row.get("reason_start") or "")[:100],
        reason_end=str(row.get("reason_end") or "")[:100],
        original_data=original,
    )


def invalidate_stats_cache():
    from django.core.cache import cache

    cache.clear()
