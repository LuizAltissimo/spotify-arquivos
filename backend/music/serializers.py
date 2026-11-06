from rest_framework import serializers
from .models import Playback


class PlaybackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playback
        fields = (
            "played_at",
            "duration_ms",
            "media_type",
            "track_uri",
            "track_name",
            "artist_name",
            "album_name",
            "skipped",
            "shuffle",
            "platform",
        )
