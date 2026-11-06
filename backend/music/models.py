from django.db import models


class ImportBatch(models.Model):
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    files_found = models.PositiveIntegerField(default=0)
    files_read = models.PositiveIntegerField(default=0)
    files_ignored = models.PositiveIntegerField(default=0)
    records_read = models.PositiveIntegerField(default=0)
    records_created = models.PositiveIntegerField(default=0)
    records_duplicate = models.PositiveIntegerField(default=0)
    records_invalid = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)


class SourceFile(models.Model):
    relative_path = models.CharField(max_length=500, unique=True)
    size_bytes = models.BigIntegerField(default=0)
    modified_at = models.DateTimeField(null=True, blank=True)
    sha256 = models.CharField(max_length=64, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    records_read = models.PositiveIntegerField(default=0)
    result = models.CharField(max_length=30, default="pending")
    last_error = models.CharField(max_length=240, blank=True)


class Playback(models.Model):
    source_file = models.ForeignKey(
        SourceFile, on_delete=models.PROTECT, related_name="playbacks"
    )
    batch = models.ForeignKey(
        ImportBatch, on_delete=models.PROTECT, related_name="playbacks"
    )
    event_key = models.CharField(max_length=64, unique=True)
    played_at = models.DateTimeField(db_index=True)
    original_timestamp = models.CharField(max_length=80, blank=True)
    duration_ms = models.PositiveBigIntegerField(default=0)
    media_type = models.CharField(max_length=20, db_index=True)
    track_uri = models.CharField(max_length=240, blank=True, db_index=True)
    track_name = models.CharField(max_length=500, blank=True)
    artist_name = models.CharField(max_length=500, blank=True, db_index=True)
    album_name = models.CharField(max_length=500, blank=True, db_index=True)
    episode_name = models.CharField(max_length=500, blank=True)
    episode_uri = models.CharField(max_length=240, blank=True)
    skipped = models.BooleanField(null=True, blank=True)
    shuffle = models.BooleanField(null=True, blank=True)
    platform = models.CharField(max_length=160, blank=True)
    reason_start = models.CharField(max_length=100, blank=True)
    reason_end = models.CharField(max_length=100, blank=True)
    original_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["played_at", "media_type"]),
            models.Index(fields=["track_uri", "played_at"]),
        ]
