import json
import tempfile
from pathlib import Path
from django.test import Client, SimpleTestCase, TestCase
from django.utils import timezone
from .importer import iter_json_array
from .models import ImportBatch, Playback, SourceFile
from .services import normalize_event, parse_timestamp


class JsonReaderTests(SimpleTestCase):
    def test_streams_array_and_preserves_records(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "history.json"
            path.write_text(
                json.dumps(
                    [{"ts": "2024-01-01T00:00:00Z"}, {"ts": "2024-01-02T00:00:00Z"}]
                ),
                encoding="utf-8",
            )
            self.assertEqual(
                list(iter_json_array(path)),
                [{"ts": "2024-01-01T00:00:00Z"}, {"ts": "2024-01-02T00:00:00Z"}],
            )

    def test_rejects_malformed_array(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "broken.json"
            path.write_text('[{"ts":"2024-01-01T00:00:00Z"}', encoding="utf-8")
            with self.assertRaises(ValueError):
                list(iter_json_array(path))


class PlaybackNormalizationTests(TestCase):
    def setUp(self):
        self.source = SourceFile.objects.create(relative_path="sample.json")
        self.batch = ImportBatch.objects.create()

    def test_utc_timestamp_and_private_field_handling(self):
        event = normalize_event(
            {
                "ts": "2024-01-01T01:00:00Z",
                "ms_played": 90000,
                "spotify_track_uri": "spotify:track:abc",
                "master_metadata_track_name": "Faixa",
                "master_metadata_album_artist_name": "Artista",
                "master_metadata_album_album_name": "Disco",
                "ip_addr": "private",
            },
            self.source,
            self.batch,
        )
        event.save()
        self.assertEqual(timezone.localtime(event.played_at).hour, 22)
        self.assertEqual(event.media_type, "music")
        self.assertNotIn("ip_addr", event.original_data)
        self.assertEqual(event.original_data["ms_played"], 90000)

    def test_episode_is_preserved_outside_music(self):
        event = normalize_event(
            {
                "ts": "2024-01-01T01:00:00Z",
                "ms_played": 30000,
                "episode_name": "Episódio",
                "spotify_episode_uri": "spotify:episode:xyz",
            },
            self.source,
            self.batch,
        )
        self.assertEqual(event.media_type, "episode")
        self.assertEqual(event.episode_name, "Episódio")

    def test_repeated_event_key_is_idempotent(self):
        row = {
            "ts": "2024-01-01T01:00:00Z",
            "ms_played": 90000,
            "spotify_track_uri": "spotify:track:abc",
            "master_metadata_track_name": "Faixa",
        }
        Playback.objects.bulk_create(
            [normalize_event(row, self.source, self.batch)], ignore_conflicts=True
        )
        Playback.objects.bulk_create(
            [normalize_event(row, self.source, self.batch)], ignore_conflicts=True
        )
        self.assertEqual(Playback.objects.count(), 1)

    def test_timestamp_parser_rejects_invalid_value(self):
        self.assertIsNone(parse_timestamp("not-a-date"))

    def test_custom_period_requires_a_valid_date_range(self):
        response = Client().get("/api/overview/?period=custom&from=2024-04-01")
        self.assertEqual(response.status_code, 400)
        response = Client().get(
            "/api/overview/?period=custom&from=2024-04-02&to=2024-04-01"
        )
        self.assertEqual(response.status_code, 400)

    def test_ranking_endpoint_returns_paged_json(self):
        response = Client().get("/api/tracks/?page=1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["page_size"], 30)
