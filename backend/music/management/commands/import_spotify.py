from django.core.management.base import BaseCommand
from rest_framework.test import APIRequestFactory
from music.views import scan_import


class Command(BaseCommand):
    help = "Importa os arquivos JSON do diretório SPOTIFY_DATA_DIR configurado."

    def handle(self, *args, **options):
        response = scan_import(
            APIRequestFactory().post("/api/imports/run/", {}, format="json")
        )
        self.stdout.write(response.content.decode("utf-8"))
