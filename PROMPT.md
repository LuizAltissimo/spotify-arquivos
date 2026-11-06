# PROMPT.md --- Spotify Analytics

## Papel e objetivo

Atue como engenheiro(a) de software sênior, arquiteto(a) de aplicações e
desenvolvedor(a) full-stack. Sua tarefa é **inspecionar o projeto
existente, planejar, implementar, testar e documentar** uma aplicação
local de análise musical baseada exclusivamente nos arquivos JSON
exportados pelo Spotify.

O produto deve oferecer uma experiência de análise musical inspirada no
Last.fm, em plataformas como stats.fm e no Spotify Wrapped, sem copiar
marcas, identidade visual ou elementos proprietários. Crie uma
identidade visual própria, refinada e consistente.

Não entregue apenas uma proposta, wireframe ou telas estáticas:
implemente uma aplicação funcional, conectada ao banco de dados e aos
dados reais disponíveis na máquina.

Trabalhe no repositório e no ambiente atuais. Antes de alterar arquivos,
inspecione a estrutura, identifique o sistema operacional, verifique o
ambiente virtual existente e descubra onde estão os JSON do Spotify. Não
sobrescreva, mova, renomeie ou modifique os arquivos originais do
histórico.

------------------------------------------------------------------------

## 1. Tecnologias e restrições

### Stack definida

-   **Backend:** Python + Django.
-   **API:** Django REST Framework, quando apropriado.
-   **Frontend:** React.
-   **Build e desenvolvimento:** Vite.
-   **Estilização:** Tailwind CSS.
-   **Banco de dados:** SQLite.
-   **Autenticação:** sistema de autenticação do Django.
-   **Gráficos:** escolha uma biblioteca React adequada, por exemplo
    Recharts ou Chart.js.
-   **Ícones:** Lucide React ou alternativa equivalente.
-   **Idioma da interface:** português brasileiro (`pt-BR`).
-   **Fuso horário padrão:** `America/Sao_Paulo`, configurável.

O Node.js e o Django já estão instalados no ambiente de desenvolvimento
do usuário, e existe um ambiente virtual chamado `_env`. **Reutilize o
ambiente existente.** Não crie outro ambiente virtual sem necessidade e
não reinstale ferramentas que já estejam disponíveis.

### Instalação de dependências

Você está autorizado a instalar bibliotecas e dependências que não
estejam instaladas, desde que sejam necessárias ao projeto.

Antes de instalar: 1. Verifique as versões e dependências já existentes.
2. Verifique se o ambiente `_env` está ativo ou use explicitamente o
interpretador dele. 3. Verifique a versão do Node.js e o gerenciador de
pacotes disponível. 4. Prefira versões estáveis e compatíveis. 5.
Registre as dependências no `requirements.txt` e no
`package.json`/lockfile. 6. Não instale pacotes redundantes nem
substitua dependências existentes sem justificativa.

Se uma biblioteca necessária estiver ausente, instale-a no ambiente
correto. Não interrompa o trabalho apenas porque uma dependência ainda
não está instalada. Caso a instalação falhe por falta de permissão ou
conectividade, explique o bloqueio e prossiga com uma alternativa
razoável, se possível.

### Restrições de escopo

-   A aplicação deve funcionar localmente.
-   Nesta primeira versão, **não implementar upload de arquivos pela
    interface**.
-   Os arquivos JSON já estão armazenados na máquina do usuário. A
    aplicação deve ler esses arquivos a partir de um diretório local
    configurável.
-   Não depender da API oficial do Spotify para obter o histórico de
    audição.
-   APIs externas podem ser usadas opcionalmente apenas para enriquecer
    metadados visuais, como capas de álbuns e imagens de artistas.
-   O funcionamento principal deve continuar disponível sem APIs
    externas ou conexão com a internet.
-   Não utilizar microsserviços nesta primeira versão.
-   Não adicionar serviços pagos ou chaves de API obrigatórias.

------------------------------------------------------------------------

## 2. Arquitetura

Adote **Modular Monolith (Monólito Modular)** combinado com **Layered
Architecture (Arquitetura em Camadas)** no backend.

Organize o backend Django por domínios funcionais. Separe
responsabilidades de forma clara entre:

-   `models`: entidades e persistência.
-   `serializers`: validação e representação dos dados da API.
-   `views`: endpoints e controle HTTP.
-   `services`: regras de negócio e operações complexas.
-   `selectors`: consultas e leitura de dados.
-   `repositories`: somente quando trouxer benefício real de isolamento
    de acesso a dados.
-   `permissions`: autorização e controle de acesso.
-   `tests`: testes automatizados.

O frontend React deve seguir uma **Feature-Based Architecture**,
agrupando páginas, componentes, hooks, serviços e tipos por
funcionalidade. Componentes compartilhados devem ficar em uma área
comum.

Evite abstrações desnecessárias. Não crie camadas vazias apenas para
seguir um padrão. Mantenha módulos coesos, dependências explícitas e
responsabilidades bem definidas.

### Estrutura sugerida

Adapte a estrutura à realidade do repositório, mas busque algo
semelhante a:

``` text
spotify-analytics/
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── core/
│   │   ├── library/
│   │   ├── playback/
│   │   ├── imports/
│   │   ├── analytics/
│   │   ├── accounts/
│   │   └── settings/
│   ├── tests/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── overview/
│   │   │   ├── tracks/
│   │   │   ├── artists/
│   │   │   ├── albums/
│   │   │   ├── history/
│   │   │   ├── calendar/
│   │   │   ├── timeline/
│   │   │   ├── wrapped/
│   │   │   ├── comparisons/
│   │   │   ├── imports/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.*
├── data/
│   └── .gitkeep
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

A estrutura acima é uma referência, não uma exigência rígida. Não mova
arquivos existentes sem necessidade. O banco SQLite, arquivos de
configuração e diretórios de dados devem ficar em locais previsíveis e
documentados.

------------------------------------------------------------------------

## 3. Inspeção inicial obrigatória

Antes de implementar:

1.  Liste os arquivos e diretórios do repositório.
2.  Identifique o backend e o frontend já existentes.
3.  Verifique se `_env` existe e quais pacotes já estão instalados nele.
4.  Verifique Node.js, npm/pnpm/yarn e versões disponíveis.
5.  Localize os arquivos JSON exportados pelo Spotify na máquina.
6.  Identifique os nomes, quantidade, tamanhos e formatos dos arquivos
    encontrados.
7.  Leia amostras representativas dos JSON para descobrir o esquema real
    dos dados.
8.  Não presuma que todos os arquivos usam exatamente o mesmo formato.
9.  Não imprima dados pessoais ou grandes trechos do histórico no
    terminal ou nos logs.
10. Apresente um plano curto baseado no que encontrou e então prossiga
    com a implementação.

Se houver mais de um diretório possível para o histórico, escolha uma
configuração segura e documente como alterá-la. Se não encontrar nenhum
JSON, implemente o mecanismo de descoberta/configuração e deixe claro
qual caminho o usuário precisa informar. Não invente dados para simular
que a importação foi concluída.

------------------------------------------------------------------------

## 4. Leitura dos arquivos JSON do Spotify

O histórico do Spotify é a fonte principal e exclusiva dos dados de
reprodução.

### Requisitos do leitor

-   Ler arquivos JSON locais, sem upload pela interface.
-   Aceitar múltiplos arquivos de um mesmo histórico.
-   Suportar os formatos de exportação encontrados na máquina,
    incluindo, quando presentes, arquivos de Extended Streaming History.
-   Não assumir que todos os campos estarão presentes.
-   Tratar campos nulos, vazios, desconhecidos ou com tipos inesperados.
-   Validar os arquivos antes de processá-los.
-   Processar arquivos grandes sem carregar desnecessariamente todo o
    conteúdo na memória, quando tecnicamente viável.
-   Exibir quantos arquivos foram encontrados, lidos, processados e
    ignorados.
-   Registrar erros de forma compreensível, sem expor informações
    privadas.
-   Permitir executar novamente a varredura/importação.
-   Não apagar dados já importados ao encontrar arquivos novos.
-   Evitar duplicações em importações repetidas.

### Campos possíveis

Os nomes variam de acordo com a exportação. Investigue o esquema real.
os dados estão na pasta spotify_data, ele possui um readme para os json
Entre os campos que podem aparecer estão:

-   `ts`: data/hora da reprodução.
-   `ms_played`: duração reproduzida em milissegundos.
-   `master_metadata_track_name`: nome da faixa.
-   `master_metadata_album_artist_name`: artista.
-   `master_metadata_album_album_name`: álbum.
-   `spotify_track_uri`: URI da faixa.
-   `spotify_episode_uri`: URI de episódio, quando houver.
-   `reason_start` e `reason_end`.
-   `shuffle`.
-   `skipped`.
-   `platform`.
-   `conn_country`.
-   `offline`.
-   `incognito_mode`.

Não descarte silenciosamente registros que não correspondam a músicas.
Se podcasts ou episódios estiverem presentes, identifique-os e decida
como tratá-los de maneira explícita. Nesta primeira versão, o foco das
estatísticas é música; conteúdos não musicais podem ser preservados e
excluídos dos rankings musicais, com essa decisão documentada.

### Preservação dos dados originais

-   Nunca editar os JSON originais.
-   Manter os arquivos na localização original.
-   Preservar, no banco, os campos originais relevantes de cada evento,
    preferencialmente em um campo JSON ou estrutura equivalente.
-   Criar campos normalizados para consultas e estatísticas.
-   Manter rastreabilidade entre cada registro processado e seu arquivo
    de origem.
-   Guardar metadados da importação: nome/caminho relativo do arquivo,
    tamanho, data de modificação, hash, data de processamento,
    quantidade de registros e resultado.
-   Não guardar caminhos absolutos sensíveis em locais expostos ao
    frontend.
-   Não copiar os arquivos originais para dentro de diretórios públicos
    do frontend.

### Deduplicação

Importações repetidas não podem inflar as estatísticas.

Implemente uma estratégia determinística de identificação de eventos,
usando uma combinação adequada de campos do registro, como URI da faixa,
timestamp, duração e outros campos disponíveis. Considere que dois
eventos legítimos podem ter valores parecidos; evite deduplicar somente
por nome da música ou artista.

Crie índices e restrições de unicidade adequados. Documente a estratégia
e teste importações repetidas.

### Diretório local configurável

Crie uma configuração clara para o caminho dos JSON, preferencialmente
por variável de ambiente ou configuração local não versionada. Exemplo
ilustrativo:

``` env
SPOTIFY_DATA_DIR=/caminho/para/os/json/do/spotify
```

Não assuma que esse caminho existe. Documente como configurá-lo no
sistema operacional do usuário.

A aplicação deve ler somente o diretório configurado e seus arquivos
permitidos. Valide caminhos e impeça path traversal. Não permita que uma
requisição HTTP arbitrária faça o backend ler qualquer arquivo da
máquina.

------------------------------------------------------------------------

## 5. Datas, horários e localização brasileira

Trate datas e horários com muito cuidado.

-   Interpretar timestamps conforme o formato real encontrado nos JSON.
-   Preservar o timestamp original.
-   Converter datas para objetos de data/hora com fuso horário.
-   Usar `America/Sao_Paulo` como fuso padrão inicial, mas permitir
    configuração.
-   Armazenar datas de forma consistente e timezone-aware.
-   Evitar conversões duplicadas de fuso.
-   Não tratar timestamp UTC como horário local sem conversão.
-   Considerar corretamente mudanças históricas de horário, quando
    aplicável.
-   Exibir datas no formato brasileiro `dd/MM/yyyy`.
-   Exibir horários no formato `HH:mm` ou `HH:mm:ss` quando necessário.
-   Exibir números com convenção brasileira: separador decimal por
    vírgula e milhar por ponto.
-   Exibir duração de forma amigável, por exemplo `2h 35min`.
-   Usar nomes de meses e dias da semana em português.
-   Incluir a informação do fuso utilizado nas configurações e na
    documentação.

A camada de cálculo deve trabalhar com datas consistentes; a formatação
brasileira deve ocorrer na apresentação. Não use strings formatadas como
base para cálculos.

------------------------------------------------------------------------

## 6. Modelagem de dados

Projete um modelo que suporte centenas de milhares de eventos sem
duplicar desnecessariamente informações.

Considere, conforme necessário:

-   Usuário.
-   Artista.
-   Álbum.
-   Faixa.
-   Evento de reprodução (`Playback`).
-   Lote/execução de importação (`ImportBatch`).
-   Gênero musical.
-   Preferências do usuário.
-   Metadados de enriquecimento externo.

### Evento de reprodução

Cada evento de audição deve ser preservado individualmente. Se uma faixa
foi ouvida 50 vezes, devem existir 50 eventos, não apenas um contador
agregado.

Armazene, quando disponíveis:

-   Timestamp original.
-   Data/hora normalizada.
-   Duração reproduzida em milissegundos.
-   Referência à faixa.
-   URI/identificador do Spotify.
-   Nome original da faixa, artista e álbum, se disponíveis.
-   Campos originais relevantes.
-   Arquivo de origem e lote de importação.
-   Informações como `skipped`, `shuffle`, `platform` e razões de
    início/fim.

### Regras de modelagem

-   Normalizar entidades musicais para evitar repetição excessiva.
-   Preservar os valores originais mesmo quando houver normalização.
-   Tratar faixas sem URI ou metadados completos.
-   Não unir artistas diferentes apenas porque possuem nomes iguais sem
    evidência suficiente.
-   Criar índices para timestamps, IDs/URIs, relações e campos usados em
    filtros.
-   Usar migrations do Django.
-   Evitar armazenar estatísticas deriváveis como fonte primária de
    verdade.
-   Se criar tabelas de agregação/cache, elas devem poder ser
    reconstruídas a partir dos eventos originais.

O sistema é local e de uso pessoal nesta primeira versão, mas a
modelagem não deve impedir uma futura evolução para múltiplos usuários.

------------------------------------------------------------------------

## 7. Regras de negócio e estatísticas

Implemente as estatísticas a partir dos eventos reais. Defina e
documente exatamente o que cada indicador significa.

### Indicadores solicitados

1.  Total de músicas reproduzidas.
2.  Total de minutos e horas escutadas.
3.  Quantidade de artistas diferentes.
4.  Quantidade de álbuns diferentes.
5.  Artista mais ouvido.
6.  Música mais ouvida.
7.  Álbum mais ouvido.
8.  Dia com maior quantidade de reproduções.
9.  Horário em que o usuário mais escuta música.
10. Média diária e mensal de audição.
11. Maior sequência de dias ouvindo música.
12. Evolução musical ao longo dos anos.
13. Distribuição por gêneros musicais.

### Definições importantes

-   Diferencie eventos de reprodução de faixas únicas.
-   A soma do tempo ouvido deve usar `ms_played`, e não presumir a
    duração total da faixa.
-   Não conte uma reprodução curta como uma audição completa sem uma
    regra explícita.
-   Não descarte eventos curtos do histórico bruto.
-   Se houver uma métrica de "reprodução válida" ou "play", documente o
    limiar utilizado e permita que a regra seja ajustada.
-   Diferencie ranking por quantidade de eventos e ranking por tempo
    escutado.
-   Para médias diárias, explique se dias sem audição entram no
    denominador.
-   Para médias mensais, considere o período selecionado e meses
    parciais.
-   Para sequência de dias, use dias locais no fuso configurado e defina
    se qualquer evento conta como dia ativo.
-   Para horário de maior audição, agrupe por hora local e informe o
    critério utilizado.
-   Em empates, use uma ordenação estável e previsível.
-   Não invente gênero musical quando ele não existir nos dados.

### Gêneros musicais

Os JSON de histórico podem não conter gêneros. Portanto:

-   Verifique se os gêneros estão disponíveis em algum arquivo
    exportado.
-   Caso não estejam, permita enriquecimento opcional por uma API
    externa de metadados.
-   A aplicação deve funcionar sem esse enriquecimento.
-   Indique claramente quando os gêneros estiverem indisponíveis ou
    incompletos.
-   Não classifique gêneros por suposição baseada apenas no nome.
-   Armazene a origem e a data de atualização dos metadados externos.

### Filtros globais

Implemente filtros reutilizáveis para:

-   Últimos 7 dias.
-   Últimos 30 dias.
-   Últimos 3 meses.
-   Últimos 6 meses.
-   Ano atual.
-   Ano anterior.
-   Todo o período.
-   Intervalo personalizado.

As páginas e os indicadores devem respeitar o período selecionado quando
isso fizer sentido. Deixe claro quando um indicador for histórico total
e não estiver sujeito ao filtro.

------------------------------------------------------------------------

## 8. Páginas e funcionalidades

Crie navegação consistente entre as páginas abaixo. Todas devem usar
dados reais e estados de carregamento, vazio e erro.

### 1. Overview

Dashboard inicial com:

-   Total de reproduções.
-   Tempo total escutado.
-   Artistas e álbuns únicos.
-   Artista, faixa e álbum mais ouvidos.
-   Gráfico de audição ao longo do tempo.
-   Distribuição por horário e dia da semana.
-   Top artistas, faixas e álbuns.
-   Comparação com período anterior, quando houver dados suficientes.
-   Filtro global de período.

### 2. Tracks

-   Ranking de músicas.
-   Quantidade de reproduções por faixa.
-   Tempo total escutado por faixa.
-   Artista e álbum relacionados.
-   Busca e ordenação.
-   Filtros por período.
-   Paginação ou carregamento incremental.
-   Exibição de capa quando disponível.

### 3. Artists

-   Ranking de artistas.
-   Quantidade de reproduções e tempo escutado.
-   Evolução do consumo de cada artista.
-   Artistas mais ouvidos por período.
-   Busca e filtros.
-   Imagem do artista quando disponível.

### 4. Albums

-   Ranking de álbuns.
-   Reproduções e tempo escutado.
-   Artista relacionado.
-   Evolução por período.
-   Capas quando disponíveis.
-   Busca, ordenação e filtros.

### 5. Listening History

-   Histórico cronológico completo.
-   Data e horário local.
-   Faixa, artista e álbum.
-   Duração reproduzida.
-   Indicação de evento curto/pulado, quando possível.
-   Filtros por data, artista, álbum e faixa.
-   Paginação no backend.
-   Ordenação previsível.

Não envie centenas de milhares de registros de uma só vez ao frontend.

### 6. Calendar

-   Calendário de atividade musical.
-   Intensidade visual conforme o volume de audição.
-   Total de reproduções por dia.
-   Tempo escutado por dia.
-   Seleção de um dia para ver detalhes.
-   Navegação entre meses e anos.
-   Legenda compreensível e acessível.

### 7. Timeline

-   Evolução dos hábitos musicais.
-   Reproduções por dia, semana, mês e ano.
-   Tempo escutado ao longo do tempo.
-   Mudanças nos artistas mais ouvidos.
-   Descoberta e recorrência de artistas, quando os dados permitirem.
-   Filtros temporais.

### 8. Wrapped

Criar retrospectivas anuais inspiradas no conceito de retrospectiva
musical, com identidade visual própria.

Para cada ano disponível, apresentar:

-   Total de reproduções.
-   Tempo escutado.
-   Artista principal.
-   Faixa principal.
-   Álbum principal.
-   Dia ou mês de maior atividade.
-   Top 5 ou Top 10 de artistas, faixas e álbuns.
-   Distribuição por horários e dias.
-   Evolução em relação ao ano anterior, quando possível.
-   Cards visuais com boa hierarquia e possibilidade de
    compartilhamento/exportação futuramente.

Não criar resultados para anos sem dados. Diferenciar claramente dados
parciais de anos completos.

### 9. Comparisons

-   Comparar dois períodos escolhidos.
-   Comparar anos.
-   Comparar artistas, faixas e álbuns.
-   Mostrar diferenças absolutas e percentuais.
-   Indicar aumento, queda ou estabilidade.
-   Evitar percentuais enganosos quando o período de referência tiver
    valor zero.
-   Explicar a duração dos períodos comparados.

### 10. Import

Embora não exista upload nesta versão, esta página deve gerenciar a
leitura dos arquivos locais:

-   Diretório configurado.
-   Arquivos encontrados.
-   Tamanho e data de modificação.
-   Última importação.
-   Quantidade de registros identificados e processados.
-   Registros novos, duplicados, ignorados e inválidos.
-   Estado da importação.
-   Erros e avisos compreensíveis.
-   Botão para verificar novamente o diretório.
-   Botão para iniciar/reexecutar a importação.
-   Histórico das execuções.

A interface não deve permitir selecionar caminhos arbitrários no
servidor. O diretório deve ser configurado localmente de forma segura.

### 11. Settings

-   Tema escuro/claro.
-   Fuso horário.
-   Preferências de exibição.
-   Diretório de dados, com instruções seguras de configuração.
-   Informações da biblioteca importada.
-   Opções para reconstruir estatísticas/agregações.
-   Informações sobre metadados externos.
-   Configurações de privacidade.
-   Informações da versão e documentação.

------------------------------------------------------------------------

## 9. Design e experiência do usuário

Crie uma interface moderna, premium e orientada a dados.

### Direção visual

-   Tema escuro como padrão.
-   Tema claro opcional.
-   Visual limpo, elegante e consistente.
-   Boa hierarquia tipográfica.
-   Espaçamento generoso, sem desperdício de espaço.
-   Cards de indicadores com leitura rápida.
-   Gráficos interativos, com tooltips úteis.
-   Cores de destaque inspiradas no universo musical, mas sem reproduzir
    exatamente a identidade do Spotify ou Last.fm.
-   Capas e imagens usadas com consistência.
-   Ícones consistentes.
-   Animações sutis e funcionais, sem prejudicar o desempenho.

### Layout

-   Sidebar ou navegação lateral em telas grandes.
-   Navegação adaptada para dispositivos móveis.
-   Cabeçalho com título da página e filtros relevantes.
-   Área de conteúdo com largura e espaçamento equilibrados.
-   Estados de carregamento com skeletons.
-   Estados vazios com explicação e ação útil.
-   Mensagens de erro claras.
-   Contraste e acessibilidade adequados.

### Responsividade e acessibilidade

-   Funcionar em desktop, tablet e celular.
-   Não depender de hover para ações essenciais.
-   Suportar navegação por teclado.
-   Usar labels e semântica adequada.
-   Garantir contraste legível.
-   Evitar tabelas impossíveis de usar em telas pequenas.

Não use dados fictícios no dashboard final. Durante desenvolvimento,
dados mockados podem ser usados apenas em componentes isolados e testes,
nunca apresentados como se fossem estatísticas reais do usuário.

------------------------------------------------------------------------

## 10. Imagens e enriquecimento de metadados

A aplicação pode consultar uma API externa para obter imagens de:

-   Artistas.
-   Capas de álbuns.
-   Faixas, quando disponíveis.

Esse enriquecimento é opcional.

Requisitos:

-   O histórico e as estatísticas devem funcionar sem API externa.
-   Não exigir chave ou conta paga para iniciar a aplicação.
-   Isolar a integração em um serviço próprio.
-   Implementar timeout, tratamento de falhas e cache.
-   Evitar chamadas repetidas para o mesmo artista/álbum.
-   Guardar a origem e a data de obtenção da imagem.
-   Respeitar limites de uso e termos da API escolhida.
-   Não bloquear o carregamento do dashboard se a API estiver
    indisponível.
-   Usar placeholders elegantes quando não houver imagem.
-   Não armazenar imagens em diretórios públicos sem necessidade.

Antes de escolher uma API, avalie disponibilidade, documentação,
limites, necessidade de chave e condições de uso. Documente a escolha.

------------------------------------------------------------------------

## 11. Backend e API

Use Django REST Framework para fornecer dados ao React.

Organize endpoints por domínio e mantenha contratos consistentes.
Exemplos conceituais:

``` text
/api/overview/
/api/tracks/
/api/artists/
/api/albums/
/api/history/
/api/calendar/
/api/timeline/
/api/wrapped/<year>/
/api/comparisons/
/api/imports/status/
/api/imports/scan/
/api/imports/run/
/api/settings/
```

Os caminhos são sugestões; ajuste conforme a organização final.

### Requisitos da API

-   Validar parâmetros e intervalos de datas.
-   Paginar listas extensas.
-   Permitir filtros e ordenação controlados.
-   Retornar somente os campos necessários.
-   Evitar consultas N+1.
-   Usar `select_related` e `prefetch_related` quando apropriado.
-   Criar índices para consultas frequentes.
-   Padronizar respostas e erros.
-   Não expor caminhos locais sensíveis.
-   Não permitir execução de comandos ou leitura de arquivos arbitrários
    via endpoints.
-   Restringir endpoints de importação a operações locais previstas.
-   Documentar endpoints e exemplos de resposta.

### Autenticação

Implemente autenticação usando os recursos nativos do Django.

-   Não implemente algoritmo próprio de hash ou criptografia de senhas.
-   Use os password hashers seguros do Django.
-   Nunca armazene senhas em texto puro.
-   Proteja endpoints privados.
-   Configure corretamente CSRF, cookies, CORS e sessões conforme a
    estratégia escolhida.
-   Não coloque credenciais ou tokens secretos no frontend.
-   Como a aplicação é local e de uso pessoal, mantenha a solução
    simples, mas sem remover proteções de segurança.

Se o sistema de login não trouxer benefício real para a primeira
execução local, mantenha-o implementado de forma simples e documente a
configuração inicial. Não crie credenciais padrão inseguras.

------------------------------------------------------------------------

## 12. Performance e escalabilidade local

O sistema deve suportar centenas de milhares de eventos de reprodução.

Implemente:

-   Índices de banco adequados.
-   Consultas agregadas no banco sempre que possível.
-   Paginação no backend.
-   Processamento em lotes durante importações.
-   Evitar recalcular estatísticas pesadas em cada requisição.
-   Cache de resultados agregados, com invalidação após nova importação
    ou alteração relevante.
-   Cache com chave que considere período, filtros e usuário, quando
    aplicável.
-   Estratégia para reconstruir agregações e limpar cache.
-   Frontend sem renderização desnecessária de listas enormes.
-   Gráficos com séries agregadas adequadas ao período.

Não introduza Redis, Celery ou infraestrutura adicional sem necessidade
comprovada. Para a primeira versão local, prefira soluções simples
compatíveis com Django e SQLite. Se alguma tarefa demorada exigir
processamento em background, justifique a escolha e mantenha a execução
local simples.

Meça ou avalie consultas importantes com dados representativos. Não
afirme que a aplicação é performática sem validar os caminhos críticos.

------------------------------------------------------------------------

## 13. Segurança e privacidade

O histórico musical é dado pessoal. Trate-o como privado.

-   Não enviar o histórico completo para serviços externos.
-   Não usar dados do usuário em serviços de IA ou analytics externos.
-   Não registrar eventos de audição em logs desnecessariamente.
-   Não expor diretórios locais, nomes de usuário do sistema ou caminhos
    absolutos na API.
-   Validar todos os parâmetros recebidos.
-   Proteger contra path traversal.
-   Proteger endpoints de importação.
-   Manter segredos fora do Git.
-   Criar `.env.example` sem credenciais reais.
-   Configurar `.gitignore` para banco de dados local, JSON privados,
    caches, ambientes virtuais e arquivos sensíveis.
-   Não versionar os JSON do Spotify.
-   Não versionar o banco com dados pessoais.
-   Não desativar proteções do Django para facilitar o desenvolvimento.

------------------------------------------------------------------------

## 14. Testes obrigatórios

Crie testes automatizados para regras críticas.

### Importação

-   Arquivo JSON válido.
-   Arquivo inválido ou malformado.
-   Arquivo vazio.
-   Campos opcionais ausentes.
-   Diferentes formatos de exportação encontrados.
-   Registros sem URI.
-   Registros de podcasts/episódios.
-   Arquivos grandes.
-   Importação repetida sem duplicação.
-   Arquivo com registros parcialmente inválidos.
-   Preservação dos dados originais.

### Datas e estatísticas

-   Conversão de UTC para `America/Sao_Paulo`.
-   Mudança de dia após conversão de fuso.
-   Formatação brasileira.
-   Total de reproduções.
-   Tempo total escutado.
-   Rankings por faixa, artista e álbum.
-   Dia e hora de maior atividade.
-   Média diária e mensal.
-   Sequência de dias.
-   Evolução anual.
-   Períodos vazios e parciais.
-   Empates nos rankings.
-   Dados sem gênero.

### API e frontend

-   Permissões e autenticação.
-   Filtros e paginação.
-   Respostas vazias.
-   Tratamento de erros.
-   Estados de carregamento.
-   Navegação entre páginas.
-   Tema claro e escuro.
-   Responsividade básica.

Não considere a tarefa concluída se os testes críticos falharem.

------------------------------------------------------------------------

## 15. Documentação e execução

Crie documentação clara para uma pessoa que já tem Python/Django e
Node.js instalados.

O `README.md` deve explicar:

1.  Visão geral do projeto.
2.  Funcionalidades.
3.  Arquitetura e estrutura de diretórios.
4.  Pré-requisitos e versões testadas.
5.  Como ativar/reutilizar `_env`.
6.  Como instalar dependências ausentes.
7.  Como configurar o diretório dos JSON.
8.  Como executar migrations.
9.  Como iniciar o backend.
10. Como iniciar o frontend.
11. Como executar os testes.
12. Como realizar/repetir a importação local.
13. Como configurar imagens/metadados externos, se houver.
14. Limitações conhecidas.
15. Como fazer backup do banco e dos dados.
16. Como reconstruir estatísticas e cache.

Inclua `.env.example` e mantenha o `.env` real fora do controle de
versão.

Forneça comandos específicos para o sistema operacional identificado
durante a inspeção. Se não for possível identificar com segurança,
documente alternativas para Windows e Linux/macOS.

------------------------------------------------------------------------

## 16. Plano de trabalho obrigatório

Trabalhe em fases. Ao final de cada fase, verifique se o resultado
funciona antes de avançar.

### Fase 1 --- Reconhecimento do ambiente e dos dados

-   Inspecionar repositório.
-   Verificar `_env`, Django, Node.js e gerenciador de pacotes.
-   Localizar os JSON.
-   Analisar amostras e formatos.
-   Identificar volume e qualidade dos dados.
-   Registrar riscos e decisões técnicas.

**Entrega:** diagnóstico curto e plano de implementação adaptado ao
ambiente real.

### Fase 2 --- Fundação do projeto

-   Organizar backend e frontend.
-   Configurar Django e React/Vite.
-   Configurar Tailwind.
-   Configurar SQLite.
-   Configurar variáveis de ambiente.
-   Configurar rotas, layout base e comunicação frontend/backend.
-   Configurar linting e testes básicos, se compatíveis com o projeto.

**Entrega:** aplicação iniciando localmente nos dois lados.

### Fase 3 --- Modelagem e importador

-   Definir modelos.
-   Criar migrations.
-   Implementar leitura e validação dos JSON.
-   Normalizar eventos.
-   Preservar dados originais.
-   Implementar deduplicação.
-   Registrar lotes e resultados.
-   Criar testes de importação.

**Entrega:** histórico real importado para SQLite sem duplicação e sem
alteração dos arquivos originais.

### Fase 4 --- Camada analítica

-   Implementar regras de negócio.
-   Criar consultas e agregações.
-   Implementar filtros de período.
-   Implementar estatísticas solicitadas.
-   Implementar cache e invalidação.
-   Testar cálculos com casos controlados.

**Entrega:** serviços e endpoints analíticos funcionando com dados
reais.

### Fase 5 --- Interface principal

-   Criar identidade visual.
-   Implementar navegação e layout responsivo.
-   Criar Overview.
-   Criar componentes de gráficos e indicadores.
-   Conectar o frontend à API.
-   Tratar carregamento, vazio e erro.

**Entrega:** dashboard Overview funcional, sem dados fictícios.

### Fase 6 --- Demais páginas

Implementar Tracks, Artists, Albums, Listening History, Calendar,
Timeline, Wrapped, Comparisons, Import e Settings.

**Entrega:** páginas conectadas aos dados reais, com filtros e navegação
consistentes.

### Fase 7 --- Enriquecimento visual

-   Avaliar API de imagens.
-   Implementar integração opcional.
-   Adicionar cache e placeholders.
-   Garantir funcionamento offline ou sem API.

**Entrega:** imagens quando disponíveis, sem dependência delas para as
estatísticas.

### Fase 8 --- Qualidade, performance e segurança

-   Executar testes.
-   Revisar consultas e índices.
-   Verificar importação com volume real.
-   Revisar permissões, caminhos e segredos.
-   Corrigir bugs.
-   Verificar responsividade e acessibilidade básica.

**Entrega:** relatório do que foi testado, resultados e limitações
restantes.

### Fase 9 --- Documentação e entrega

-   Finalizar README.
-   Finalizar `.env.example`.
-   Revisar `.gitignore`.
-   Documentar arquitetura, modelos e APIs.
-   Documentar execução e importação.
-   Informar comandos exatos para iniciar o projeto.

**Entrega:** projeto executável e documentado.

------------------------------------------------------------------------

## 17. Critérios de aceite

Considere a primeira versão concluída somente quando:

-   [ ] Backend Django inicia sem erros.
-   [ ] Frontend React/Vite inicia sem erros.
-   [ ] Tailwind está configurado e aplicado.
-   [ ] SQLite está conectado e migrations estão aplicadas.
-   [ ] O diretório local de JSON pode ser configurado.
-   [ ] Os arquivos originais não são modificados.
-   [ ] O importador lê os formatos realmente encontrados.
-   [ ] Importações repetidas não duplicam eventos.
-   [ ] Cada evento de reprodução é preservado individualmente.
-   [ ] Datas e horários são convertidos corretamente.
-   [ ] As estatísticas principais são calculadas com dados reais.
-   [ ] As páginas previstas estão implementadas ou claramente
    identificadas como pendentes, sem simular funcionalidades prontas.
-   [ ] O dashboard não utiliza dados fictícios.
-   [ ] Filtros e paginação funcionam.
-   [ ] Cache é invalidado após nova importação.
-   [ ] Tema escuro e claro funcionam.
-   [ ] Layout é utilizável em desktop e celular.
-   [ ] Testes críticos passam.
-   [ ] README explica instalação, configuração e execução.
-   [ ] JSON privados, banco local e segredos estão protegidos pelo
    `.gitignore`.

------------------------------------------------------------------------

## 18. Diretrizes de execução para o Codex

-   **Implemente de verdade:** não pare após criar a estrutura ou
    apresentar um plano.
-   Antes de cada alteração relevante, entenda o código existente.
-   Preserve funcionalidades existentes que não conflitem com o projeto.
-   Não sobrescreva configurações sem verificar seu conteúdo.
-   Não apague arquivos do usuário.
-   Não altere os JSON originais.
-   Não invente campos, estatísticas ou resultados.
-   Não use mocks como substitutos de integrações reais no produto
    final.
-   Se precisar de dependências ausentes, instale-as no ambiente correto
    e registre-as.
-   Se uma decisão técnica não estiver especificada, escolha a
    alternativa mais simples, segura e sustentável, documentando a
    decisão.
-   Se houver ambiguidade sobre os dados, inspecione amostras e
    implemente tratamento robusto.
-   Não interrompa o trabalho para perguntar preferências visuais
    triviais; use bom senso e mantenha consistência.
-   Se houver um bloqueio real que dependa de informação do usuário,
    faça uma pergunta objetiva e continue as partes independentes.
-   Não declare uma funcionalidade concluída sem executá-la ou testá-la.
-   Ao terminar cada fase, informe arquivos relevantes
    criados/alterados, comandos executados, testes realizados e
    problemas encontrados.
-   Mantenha um arquivo de acompanhamento, por exemplo
    `docs/IMPLEMENTATION_STATUS.md`, com fases concluídas, pendências e
    decisões.
-   Não deixe TODOs silenciosos em funcionalidades apresentadas como
    prontas.

## Resultado esperado

Entregue uma aplicação local de análise musical completa, com visual
moderno e próprio, que leia os JSON reais do histórico do Spotify
armazenados na máquina, preserve os dados originais, calcule
estatísticas confiáveis e apresente dashboards, rankings, calendário,
linha do tempo, comparações e retrospectivas anuais.

Priorize correção dos dados, confiabilidade dos cálculos, clareza da
arquitetura, boa experiência visual e facilidade de execução local. A
aplicação deve ser funcional antes de ser considerada finalizada.
