# Sonora — arquivo musical local

Aplicação local para explorar o histórico exportado pelo Spotify. O Sonora importa arquivos JSON do disco para SQLite e apresenta reproduções, tempo escutado, rankings, atividade diária, retrospectiva e histórico. Não usa a API do Spotify e não envia o histórico para serviços externos.

## Ambiente reconhecido

- Windows 11, Python 3.14.6, Django 6.1.3 no ambiente `_env`.
- Node.js 26.13.0 e npm 11.20.0.
- `spotify_data/` contém 19 JSON: 13 arquivos de áudio e 6 de vídeo, total aproximado de 150 mil registros. Os arquivos de vídeo são majoritariamente episódios; eles são preservados e ficam fora dos rankings musicais.
- Os arquivos de áudio usam `ts` em UTC, `ms_played`, URI e nomes de faixa/artista/álbum, mais os campos de reprodução. Não há gêneros no esquema observado. `ip_addr` é removido do banco por privacidade; os outros campos de cada evento são preservados.
- A pasta não contém uma implementação preexistente. A importação usa o diretório local `spotify_data` por padrão; configure `SPOTIFY_DATA_DIR` para outro local.

## Arquitetura

`backend/` contém Django, API REST Framework, domínio de importação e consultas analíticas; `frontend/` contém React/Vite/Tailwind organizado por componentes de página; `data/` contém o SQLite ignorado pelo Git; `spotify_data/` mantém os arquivos de origem intocados. Cada evento é registrado individualmente. A identidade de deduplicação é SHA-256 dos campos do evento em JSON canônico, exceto `ip_addr`; portanto, importações repetidas não alteram as contagens. Arquivos JSON são lidos como arrays em blocos e inseridos no banco em lotes.

O tempo total soma `ms_played`, mesmo em eventos curtos. Todo evento musical com faixa/URI é contado como reprodução, sem limiar de play completo. Dias ativos usam a data local `America/Sao_Paulo`; hora de pico soma eventos por hora local. Médias diárias e mensais dividem o total pelo número de dias/meses corridos no período (incluindo dias sem escuta). A sequência considera qualquer evento musical em um dia. Empates de ranking são resolvidos alfabeticamente. Gêneros ficam explicitamente indisponíveis, sem inferência.

## Instalar e iniciar no Windows

Abra dois terminais PowerShell na raiz do projeto.

```powershell
# Terminal 1: backend
& .\_env\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
cd backend
python manage.py migrate
python manage.py import_spotify
python manage.py runserver 127.0.0.1:8000
```

```powershell
# Terminal 2: frontend
cd frontend
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite (normalmente `http://localhost:5173`). O Vite encaminha `/api` para `127.0.0.1:8000`. Para atualizar o histórico, use **Importação → Verificar e importar arquivos** ou rode novamente `python manage.py import_spotify`; arquivos sem alteração são ignorados pelo hash e eventos já vistos não são duplicados.

## Configuração dos arquivos

O diretório padrão é `<raiz do projeto>\spotify_data`. Copie `.env.example` para `.env` e defina um caminho absoluto para escolher outra pasta. Exemplo de sessão no PowerShell:

```powershell
$env:SPOTIFY_DATA_DIR = 'D:\Spotify\MyData'
python backend\manage.py import_spotify
```

O processo lê apenas arquivos `*.json` diretamente no diretório configurado. Ele não aceita caminhos vindos de requisições HTTP. Não mova nem edite os JSON originais. Para mudar o fuso, defina `SPOTIFY_TIME_ZONE`; o padrão é `America/Sao_Paulo`.

## API local

- `GET /api/health/` — estado do serviço.
- `GET /api/overview/?period=7d|30d|3m|6m|this-year|last-year|all` — indicadores, série diária e evolução anual.
- `GET /api/tracks/`, `/api/artists/`, `/api/albums/` — rankings paginados por `page`, busca `q` e período; `sort` mantém o ranking por reproduções.
- `GET /api/history/?page=1` — eventos recentes, 50 por página, com filtros de período e busca local.
- `GET /api/comparisons/?period=30d` — compara a janela selecionada com uma anterior de mesma duração.
- `GET /api/imports/status/` e `POST /api/imports/run/` — status e nova varredura local.

O banco contém eventos originais normalizados, lotes e metadados por arquivo. Os caminhos absolutos não são retornados pela API. A API foi pensada para acesso pelo frontend local; não exponha o servidor de desenvolvimento à rede.

## Verificações e backup

```powershell
cd backend
python manage.py check
python manage.py test
python manage.py showmigrations
cd ..\frontend
npm run build
```

Faça backup de `data\spotify.sqlite3` com o backend parado. Os JSON originais devem ser incluídos no backup separadamente, mantendo-os fora do Git. Para reconstruir os indicadores, execute a importação novamente; os gráficos são derivados dos eventos e o cache local expira em cinco minutos.

## Limitações desta versão

Os gêneros não existem no export encontrado. A retrospectiva e as comparações mostram métricas reais resumidas, sem geração de imagens/compartilhamento. Não há autenticação de tela nesta primeira experiência local; mantenha o backend ligado somente em localhost. O login Django padrão está disponível pelo admin após criar um superusuário com `python manage.py createsuperuser`. Capas e enriquecimento externo foram deixados de fora para preservar a operação offline.
