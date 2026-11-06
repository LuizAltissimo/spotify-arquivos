# Acompanhamento da implementação

## Feito

- Reconhecido Windows, Python 3.14.6/Django 6.1.3, Node 26.13/npm 11.20 e os 19 JSON Spotify.
- Criada base Django + REST Framework, SQLite, configuração de fuso e frontend React/Vite/Tailwind.
- Criados modelos de evento, arquivo e lote; importador em blocos, idempotente por hash e chave do evento; API local para overview, rankings pesquisáveis, histórico, comparação e reimportação.
- Criadas páginas navegáveis para Overview, rankings com paginação, histórico, calendário mensal, linha do tempo, retrospectiva por ano, comparações, importação e configurações.
- Documentados comandos, definições e limitações em README.
- Importado o histórico local: 19 arquivos verificados, 149.387 registros lidos, 149.368 eventos individuais no banco. Registros não musicais ficam preservados fora das estatísticas musicais.
- `manage.py check`, 8 testes Django, `npm run build` e `npm run lint` passaram. API conferida: overview, custom range inválido (HTTP 400), comparação, paginação inválida (HTTP 400), histórico, rankings e 19 arquivos na listagem.
- Backend e frontend de desenvolvimento iniciaram em localhost; o proxy Vite → Django respondeu ao endpoint `/api/health/` com HTTP 200.
- Reimportação final: 19 arquivos ignorados por hash inalterado; zero novos eventos.

## Decisões observadas

- O histórico usa `ts` em UTC e `ms_played`; vídeos representam em geral episódios e não entram em métricas musicais.
- `ip_addr` é descartado; eventos preservam demais campos originais.
- Gêneros não foram encontrados e não são inventados.

## Limitações conhecidas

- A compilação Vite ainda emite aviso de bundle JavaScript maior que 500 kB por causa da biblioteca de gráficos; não impede o uso.
- A interface não tem login próprio; o Django auth está instalado e o admin pode ser protegido por superusuário. Mantenha a aplicação em localhost.
- Comparações comparam o intervalo selecionado ao imediatamente anterior de mesma duração; não há escolha simultânea de dois intervalos arbitrários.
- A linha do tempo mostra evolução anual; não há detalhamento semanal/mensal nem descoberta de artistas novos. A retrospectiva tem Top 5 por categoria e ainda não exporta cards.
