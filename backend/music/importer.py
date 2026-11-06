import hashlib
import json
import os
from pathlib import Path


def file_hash(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def iter_json_array(path, chunk_size=65536):
    decoder = json.JSONDecoder()
    with path.open("r", encoding="utf-8-sig") as stream:
        buffer = ""
        pos = 0
        eof = False
        while pos >= len(buffer) and not eof:
            part = stream.read(chunk_size)
            if not part:
                eof = True
            buffer += part
        while pos < len(buffer) and buffer[pos].isspace():
            pos += 1
        if pos >= len(buffer) or buffer[pos] != "[":
            raise ValueError("O JSON deve conter uma lista de eventos.")
        pos += 1
        while True:
            while True:
                while pos < len(buffer) and (
                    buffer[pos].isspace() or buffer[pos] == ","
                ):
                    pos += 1
                if pos < len(buffer) or eof:
                    break
                part = stream.read(chunk_size)
                if not part:
                    eof = True
                buffer = buffer[pos:] + part
                pos = 0
            if pos < len(buffer) and buffer[pos] == "]":
                pos += 1
                if buffer[pos:].strip():
                    raise ValueError("Há conteúdo após o fim da lista JSON.")
                return
            if pos >= len(buffer) and eof:
                raise ValueError("Lista JSON incompleta.")
            try:
                value, end = decoder.raw_decode(buffer, pos)
            except json.JSONDecodeError:
                if eof:
                    raise ValueError("JSON malformado ou incompleto.")
                part = stream.read(chunk_size)
                if not part:
                    eof = True
                buffer = buffer[pos:] + part
                pos = 0
                continue
            yield value
            pos = end
            if pos > chunk_size * 2:
                buffer = buffer[pos:]
                pos = 0


def configured_data_dir():
    project_root = Path(__file__).resolve().parents[2]
    configured = Path(os.getenv("SPOTIFY_DATA_DIR", "spotify_data")).expanduser()
    if not configured.is_absolute():
        configured = project_root / configured
    return configured.resolve()
