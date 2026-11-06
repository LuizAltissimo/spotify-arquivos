import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Album,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Disc3,
  Headphones,
  Home,
  Library,
  ListMusic,
  Moon,
  Music2,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
  Users,
  WandSparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";
import "./ui.css";
import "./details.css";

const nav = [
  { id: "overview", label: "Visão geral", icon: Home, group: "Biblioteca" },
  { id: "tracks", label: "Faixas", icon: Music2, group: "Biblioteca" },
  { id: "artists", label: "Artistas", icon: Users, group: "Biblioteca" },
  { id: "albums", label: "Álbuns", icon: Disc3, group: "Biblioteca" },
  { id: "history", label: "Histórico", icon: ListMusic, group: "Explorar" },
  {
    id: "calendar",
    label: "Calendário",
    icon: CalendarDays,
    group: "Explorar",
  },
  {
    id: "timeline",
    label: "Linha do tempo",
    icon: Activity,
    group: "Explorar",
  },
  { id: "wrapped", label: "Retrospectiva", icon: Sparkles, group: "Explorar" },
  {
    id: "comparisons",
    label: "Comparações",
    icon: ArrowUpRight,
    group: "Explorar",
  },
  { id: "imports", label: "Importação", icon: RefreshCw, group: "Sistema" },
  { id: "settings", label: "Configurações", icon: Settings, group: "Sistema" },
];
const periods = [
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["3m", "3 meses"],
  ["6m", "6 meses"],
  ["this-year", "Este ano"],
  ["last-year", "Ano passado"],
  ["all", "Todo o período"],
  ["custom", "Personalizado"],
];
const DEFAULT_TIME_ZONE = "America/Sao_Paulo";
const number = (n = 0) => new Intl.NumberFormat("pt-BR").format(n);
const minutes = (n = 0) =>
  n >= 60
    ? `${number(Math.floor(n / 60))}h ${number(Math.round(n % 60))}min`
    : `${number(Math.round(n))} min`;
const timestampDate = (value, timeZone, options) =>
  new Date(value).toLocaleDateString("pt-BR", { timeZone, ...options });
const timestampTime = (value, timeZone, options) =>
  new Date(value).toLocaleTimeString("pt-BR", { timeZone, ...options });

function App() {
  const [page, setPage] = useState("overview"),
    [period, setPeriod] = useState("all"),
    [customFrom, setCustomFrom] = useState(""),
    [customTo, setCustomTo] = useState(""),
    [wrappedYear, setWrappedYear] = useState(""),
    [yearOptions, setYearOptions] = useState([]),
    [searchText, setSearchText] = useState(""),
    [sortBy, setSortBy] = useState("plays"),
    [listPage, setListPage] = useState(1),
    [data, setData] = useState(null),
    [list, setList] = useState(null),
    [imports, setImports] = useState(null),
    [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dark, setDark] = useState(true);
  const selected = nav.find((item) => item.id === page),
    periodQuery =
      period === "all"
        ? ""
        : period === "custom"
          ? customFrom && customTo
            ? `?period=custom&from=${customFrom}&to=${customTo}`
            : ""
          : `?period=${period}`;
  const activeQuery =
    page === "wrapped" && wrappedYear
      ? `?period=custom&from=${wrappedYear}-01-01&to=${wrappedYear}-12-31`
      : periodQuery;

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/overview/${activeQuery}`);
      if (!response.ok) throw new Error("A API não respondeu corretamente.");
      setError("");
      const overviewData = await response.json();
      setData(overviewData);
      if (page === "wrapped") {
        if (period === "all" && !wrappedYear)
          setYearOptions(overviewData.years || []);
        else {
          const allResponse = await fetch("/api/overview/");
          const allData = await allResponse.json();
          setYearOptions(allData.years || []);
        }
      }
      if (["tracks", "artists", "albums", "history"].includes(page)) {
        const params = new URLSearchParams(activeQuery.replace(/^\?/, ""));
        params.set("page", listPage);
        if (searchText)
          params.set(page === "history" ? "track" : "q", searchText);
        if (page !== "history") params.set("sort", sortBy);
        const result = await fetch(`/api/${page}/?${params.toString()}`);
        if (!result.ok)
          throw new Error("Não foi possível carregar esta lista.");
        setList(await result.json());
      }
      if (["imports", "settings"].includes(page)) {
        const result = await fetch("/api/imports/status/");
        setImports(await result.json());
      }
      if (page === "comparisons") {
        const result = await fetch(`/api/comparisons/${activeQuery}`);
        setComparison(await result.json());
      }
    } catch (err) {
      setError(`${err.message} Inicie o Django em 127.0.0.1:8000.`);
    } finally {
      setLoading(false);
    }
  }, [activeQuery, listPage, page, period, searchText, sortBy, wrappedYear]);
  // The loading state is cleared after the asynchronous API request completes.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    load();
  }, [load]);
  const chartData = useMemo(
    () =>
      (data?.daily || []).map((item) => ({
        ...item,
        label: new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
      })),
    [data],
  );
  const title = selected?.label || "Visão geral";
  const stats = [
    {
      label: "Reproduções",
      value: number(data?.plays),
      detail: "eventos musicais no período",
      icon: Headphones,
      tone: "violet",
    },
    {
      label: "Tempo escutado",
      value: minutes(data?.minutes),
      detail: "somando o tempo reproduzido",
      icon: Clock3,
      tone: "mint",
    },
    {
      label: "Artistas únicos",
      value: number(data?.unique_artists),
      detail: "neste recorte",
      icon: Users,
      tone: "amber",
    },
    {
      label: "Faixas únicas",
      value: number(data?.unique_tracks),
      detail: `${number(data?.unique_albums)} álbuns diferentes`,
      icon: Disc3,
      tone: "blue",
    },
  ];
  async function runImport() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/imports/run/", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Falha ao importar os arquivos.");
      setImports((value) => ({ ...value, last_batch: result }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`app-shell ${dark ? "theme-dark" : "theme-light"}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <WandSparkles size={20} />
          </div>
          <div>
            <strong>sonora</strong>
            <span>music atlas</span>
          </div>
        </div>
        <div className="library-card">
          <div className="library-orbit">
            <span />
            <i />
          </div>
          <div>
            <small>SUA BIBLIOTECA</small>
            <strong>{number(data?.plays)} plays</strong>
            <span>uma vida em canções</span>
          </div>
        </div>
        {["Biblioteca", "Explorar", "Sistema"].map((group) => (
          <div className="nav-group" key={group}>
            <p>{group}</p>
            {nav
              .filter((item) => item.group === group)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? "active" : ""}`}
                    onClick={() => {
                      setListPage(1);
                      setPage(item.id);
                    }}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {item.id === "overview" && <i />}
                  </button>
                );
              })}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="privacy">
            <span className="privacy-dot" />
            <div>
              <strong>Somente local</strong>
              <small>Seus dados ficam aqui</small>
            </div>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Tema claro" : "Tema escuro"}
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Seu universo sonoro</span>
            <span className="slash">/</span>
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <div className="local-pill">
              <span /> Dados locais
            </div>
            <button className="avatar" title="Perfil">
              S
            </button>
          </div>
        </header>
        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> SEU ARQUIVO MUSICAL
              </div>
              <h1>
                {page === "overview" ? (
                  <>
                    Uma vida em <em>canções.</em>
                  </>
                ) : (
                  title
                )}
              </h1>
              <p>
                {page === "overview"
                  ? "Tudo o que você ouviu, reunido em um só lugar."
                  : descriptions[page]}
              </p>
            </div>
            <button
              className="icon-button refresh"
              onClick={() => {
                setLoading(true);
                setError("");
                load();
              }}
              aria-label="Atualizar"
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <div className="toolbar">
            <div className="period-control">
              {periods.map(([id, label]) => (
                <button
                  key={id}
                  className={period === id ? "selected" : ""}
                  onClick={() => {
                    setListPage(1);
                    setPeriod(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {period === "custom" ? (
              <div className="custom-dates">
                <label>
                  De{" "}
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                </label>
                <label>
                  Até{" "}
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="period-note">
                <span>✳</span>{" "}
                {period === "all"
                  ? "Todo o seu histórico"
                  : periods.find(([key]) => key === period)?.[1]}
              </div>
            )}
          </div>
          {error && (
            <div className="error-banner">
              {error}
              <button onClick={load}>Tentar novamente</button>
            </div>
          )}
          {loading ? (
            <div className="loading-state">
              <span className="loader" /> Lendo seu universo musical…
            </div>
          ) : (
            <>
              {["tracks", "artists", "albums", "history"].includes(page) && (
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(event.target.value);
                      setListPage(1);
                    }}
                    placeholder={
                      page === "history"
                        ? "Buscar no histórico"
                        : "Buscar por nome ou artista"
                    }
                  />
                  {page !== "history" && (
                    <select
                      value={sortBy}
                      onChange={(event) => {
                        setSortBy(event.target.value);
                        setListPage(1);
                      }}
                    >
                      <option value="plays">Mais reproduzidas</option>
                      <option value="time">Mais tempo</option>
                    </select>
                  )}
                  <small>BUSCA LOCAL</small>
                </label>
              )}
              {page === "overview" && (
                <>
                  <div className="stats-grid">
                    {stats.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <article className="stat-card" key={stat.label}>
                          <div className={`stat-icon ${stat.tone}`}>
                            <Icon size={18} />
                          </div>
                          <span className="stat-label">{stat.label}</span>
                          <strong>{stat.value}</strong>
                          <small>{stat.detail}</small>
                        </article>
                      );
                    })}
                  </div>
                  <div className="dashboard-grid">
                    <section className="panel listening-panel">
                      <div className="panel-head">
                        <div>
                          <span className="panel-kicker">SEU RITMO</span>
                          <h2>O som dos seus dias</h2>
                        </div>
                        <span className="chart-legend">
                          <i /> Reproduções
                        </span>
                      </div>
                      {chartData.length ? (
                        <div className="chart-wrap">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 5,
                                left: -22,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="fillPlays"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#a78bfa"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#a78bfa"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                stroke="var(--grid)"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "var(--muted)", fontSize: 11 }}
                                minTickGap={36}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "var(--muted)", fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  background: "var(--tooltip)",
                                  border: "1px solid var(--line)",
                                  borderRadius: 12,
                                  color: "var(--text)",
                                }}
                                labelStyle={{ color: "var(--muted)" }}
                              />
                              <Area
                                type="monotone"
                                dataKey="plays"
                                name="Reproduções"
                                stroke="#a78bfa"
                                strokeWidth={2.5}
                                fill="url(#fillPlays)"
                                activeDot={{
                                  r: 5,
                                  fill: "#c4b5fd",
                                  stroke: "var(--surface)",
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Empty text="Ainda não há reproduções neste período." />
                      )}
                    </section>
                    <section className="panel top-track-panel">
                      <div className="panel-head">
                        <div>
                          <span className="panel-kicker">EM REPETIÇÃO</span>
                          <h2>Favorita do período</h2>
                        </div>
                        <div className="mini-disc">
                          <Disc3 size={23} />
                        </div>
                      </div>
                      {data?.top_track ? (
                        <div className="favorite">
                          <div className="cover-placeholder">
                            <Music2 size={29} />
                          </div>
                          <div className="favorite-meta">
                            <strong>{data.top_track.name}</strong>
                            <span>
                              {data.top_track.artist || "Artista desconhecido"}
                            </span>
                            <small>
                              {number(data.top_track.plays)} reproduções
                            </small>
                          </div>
                          <span className="favorite-spark">✳</span>
                        </div>
                      ) : (
                        <Empty text="Importe seu histórico para descobrir sua favorita." />
                      )}
                      <div className="mini-insights">
                        <div>
                          <span>Artista em destaque</span>
                          <strong>{data?.top_artist?.name || "—"}</strong>
                          <small>
                            {data?.top_artist
                              ? `${number(data.top_artist.plays)} plays`
                              : "sem dados"}
                          </small>
                        </div>
                        <div>
                          <span>Hora mais musical</span>
                          <strong>
                            {data?.peak_hour
                              ? `${String(data.peak_hour.hour).padStart(2, "0")}:00`
                              : "—"}
                          </strong>
                          <small>
                            {data?.peak_hour
                              ? `${number(data.peak_hour.plays)} reproduções`
                              : "sem dados"}
                          </small>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="top-ranks">
                    {[
                      ["Artistas", data?.top_artists || []],
                      ["Faixas", data?.top_tracks || []],
                      ["Álbuns", data?.top_albums || []],
                    ].map(([label, items]) => (
                      <section className="panel top-rank-panel" key={label}>
                        <span className="panel-kicker">
                          TOP 5 · {label.toUpperCase()}
                        </span>
                        {items.length ? (
                          items.map((item, index) => (
                            <div
                              className="top-rank-row"
                              key={`${item.name}-${index}`}
                            >
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              <strong>{item.name}</strong>
                              <small>{number(item.plays)}</small>
                            </div>
                          ))
                        ) : (
                          <Empty text="Sem reproduções neste período." />
                        )}
                      </section>
                    ))}
                  </div>
                  <section className="panel hours-panel">
                    <div className="panel-head">
                      <div>
                        <span className="panel-kicker">QUANDO VOCÊ ESCUTA</span>
                        <h2>Seu dia em música</h2>
                      </div>
                    </div>
                    <div className="hour-bars">
                      {(data?.hours || []).map((item) => (
                        <div
                          className="hour-bar"
                          title={`${item.hour}:00 · ${number(item.plays)} reproduções`}
                          key={item.hour}
                        >
                          <i
                            style={{
                              height: `${Math.max(item.plays ? 5 : 1, (item.plays / Math.max(1, ...(data?.hours || []).map((x) => x.plays))) * 100)}%`,
                            }}
                          />
                          <span>
                            {item.hour % 6 === 0
                              ? String(item.hour).padStart(2, "0")
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="panel weekdays-panel">
                    <div className="panel-head">
                      <div>
                        <span className="panel-kicker">DIA DA SEMANA</span>
                        <h2>Ritmo semanal</h2>
                      </div>
                    </div>
                    <div className="weekday-bars">
                      {(data?.weekdays || []).map((item) => (
                        <div key={item.weekday}>
                          <i
                            style={{
                              height: `${Math.max(item.plays ? 6 : 1, (item.plays / Math.max(1, ...(data?.weekdays || []).map((x) => x.plays))) * 100)}%`,
                            }}
                          />
                          <span>
                            {
                              ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][
                                item.weekday
                              ]
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <div className="bottom-grid">
                    <section className="panel pulse-panel">
                      <div className="panel-head">
                        <div>
                          <span className="panel-kicker">
                            MARCOS DO CAMINHO
                          </span>
                          <h2>Pequenas grandes coisas</h2>
                        </div>
                        <span className="badge-year">NO PERÍODO</span>
                      </div>
                      <div className="milestone-grid">
                        <Milestone
                          icon={<CalendarDays size={17} />}
                          label="Dia mais intenso"
                          value={
                            data?.peak_day
                              ? new Date(
                                  `${data.peak_day.date}T12:00:00`,
                                ).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"
                          }
                          sub={
                            data?.peak_day
                              ? `${number(data.peak_day.plays)} reproduções`
                              : "sem dados"
                          }
                        />
                        <Milestone
                          icon={<Activity size={17} />}
                          label="Maior sequência"
                          value={`${number(data?.longest_streak || 0)} dias`}
                          sub="ouvindo em dias seguidos"
                        />
                        <Milestone
                          icon={<Clock3 size={17} />}
                          label="Média por dia"
                          value={number(data?.daily_average || 0)}
                          sub="reproduções / dia"
                        />
                        <Milestone
                          icon={<Album size={17} />}
                          label="Média mensal"
                          value={number(data?.monthly_average || 0)}
                          sub="reproduções / mês"
                        />
                      </div>
                    </section>
                    <section className="panel genre-panel">
                      <div className="panel-head">
                        <div>
                          <span className="panel-kicker">PAISAGEM SONORA</span>
                          <h2>Seus gêneros</h2>
                        </div>
                        <div className="genre-doodle">◌</div>
                      </div>
                      <div className="genre-empty">
                        <div className="genre-rings">
                          <span />
                          <span />
                          <span />
                          <Music2 size={20} />
                        </div>
                        <p>Gêneros ainda desconhecidos</p>
                        <small>
                          O export do Spotify não inclui gêneros. Eles não são
                          adivinhados pelo nome das faixas.
                        </small>
                      </div>
                    </section>
                  </div>
                </>
              )}
              {["tracks", "artists", "albums"].includes(page) && (
                <Ranking page={page} list={list} onPage={setListPage} />
              )}
              {page === "history" && (
                <History
                  list={list}
                  timeZone={data?.timezone || DEFAULT_TIME_ZONE}
                  onPage={setListPage}
                />
              )}
              {["calendar", "timeline", "wrapped", "comparisons"].includes(
                page,
              ) && (
                <AnalyticsPage
                  page={page}
                  data={data}
                  comparison={comparison}
                  wrappedYear={wrappedYear}
                  yearOptions={yearOptions}
                  onWrappedYear={setWrappedYear}
                />
              )}
              {page === "imports" && (
                <ImportView imports={imports} busy={busy} onRun={runImport} />
              )}
              {page === "settings" && (
                <SettingsView
                  imports={imports}
                  timeZone={data?.timezone || DEFAULT_TIME_ZONE}
                />
              )}
            </>
          )}
          <footer className="footer">
            <span>
              SONORA <i>·</i> SEU ARQUIVO, SEU RITMO
            </span>
            <span>Fuso horário {data?.timezone || DEFAULT_TIME_ZONE}</span>
          </footer>
        </section>
      </main>
      <nav className="mobile-nav">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setListPage(1);
                setPage(item.id);
              }}
              className={page === item.id ? "active" : ""}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const descriptions = {
  tracks: "As faixas que acompanham seus dias.",
  artists: "As vozes e artistas que fazem parte da sua história.",
  albums: "Álbuns que você percorreu faixa por faixa.",
  history: "Cada reprodução, em ordem de escuta.",
  calendar: "Um mapa diário dos seus momentos musicais.",
  timeline: "Sua jornada musical, ano após ano.",
  wrapped: "Uma retrospectiva feita a partir do seu histórico real.",
  comparisons: "Como seus períodos musicais se comparam.",
  imports: "Gerencie a leitura local dos seus arquivos do Spotify.",
  settings: "Preferências e estado da biblioteca local.",
};
function Empty({ text }) {
  return (
    <div className="empty-state">
      <div>
        <Library size={21} />
      </div>
      <p>{text}</p>
    </div>
  );
}
function Milestone({ icon, label, value, sub }) {
  return (
    <div className="milestone">
      <div className="milestone-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}
function Pagination({ list, onPage }) {
  return (
    list?.count > list?.page_size && (
      <div className="pagination">
        <button disabled={list.page <= 1} onClick={() => onPage(list.page - 1)}>
          Anterior
        </button>
        <span>
          Página {list.page} · {number(list.count)} resultados
        </span>
        <button disabled={!list.has_next} onClick={() => onPage(list.page + 1)}>
          Próxima
        </button>
      </div>
    )
  );
}
function Ranking({ page, list, onPage }) {
  const rows = list?.results || [];
  const field = {
      tracks: "track_name",
      artists: "artist_name",
      albums: "album_name",
    }[page],
    title = {
      tracks: "Faixas mais ouvidas",
      artists: "Artistas mais ouvidos",
      albums: "Álbuns mais ouvidos",
    }[page];
  return (
    <section className="panel list-panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">RANKING DO PERÍODO</span>
          <h2>{title}</h2>
        </div>
        <span className="badge-year">
          {number(list?.count || 0)} RESULTADOS
        </span>
      </div>
      {rows.length ? (
        <div className="data-list">
          {rows.map((row, index) => (
            <div className="data-row" key={`${row[field]}-${index}`}>
              <span className="rank">
                {String(
                  (list?.page - 1) * list?.page_size + index + 1,
                ).padStart(2, "0")}
              </span>
              <div className="row-cover">
                <Music2 size={17} />
              </div>
              <div className="row-title">
                <strong>{row[field]}</strong>
                <small>
                  {page === "tracks"
                    ? row.artist_name
                    : page === "albums"
                      ? row.artist_name
                      : `${number(row.unique_tracks)} faixas distintas`}
                </small>
              </div>
              <div className="row-metric">
                <strong>{number(row.plays)}</strong>
                <small>plays</small>
              </div>
              <div className="row-time">
                {minutes((row.time_ms || 0) / 60000)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="Nenhum resultado neste período. Importe ou escolha outro recorte." />
      )}
      <Pagination list={list} onPage={onPage} />
    </section>
  );
}
function History({ list, timeZone, onPage }) {
  const rows = list?.results || [];
  return (
    <section className="panel list-panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">ATIVIDADE RECENTE</span>
          <h2>Seu histórico</h2>
        </div>
        <span className="badge-year">{number(list?.count || 0)} EVENTOS</span>
      </div>
      {rows.length ? (
        <div className="data-list">
          {rows.map((row, index) => (
            <div
              className="data-row history-row"
              key={`${row.played_at}-${index}`}
            >
              <span className="history-date">
                {timestampDate(row.played_at, timeZone, {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <div className="row-cover">
                <Music2 size={17} />
              </div>
              <div className="row-title">
                <strong>{row.track_name || "Faixa desconhecida"}</strong>
                <small>
                  {row.artist_name || "Artista desconhecido"}
                  {row.album_name ? ` · ${row.album_name}` : ""}
                  {row.skipped ? " · pulada" : ""}
                </small>
              </div>
              <div className="history-time">
                {timestampTime(row.played_at, timeZone, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="row-time">{minutes(row.duration_ms / 60000)}</div>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="Ainda não há eventos neste período." />
      )}
      <Pagination list={list} onPage={onPage} />
    </section>
  );
}
function AnalyticsPage({
  page,
  data,
  comparison,
  wrappedYear,
  yearOptions,
  onWrappedYear,
}) {
  if (page === "calendar") return <CalendarView data={data} />;
  if (page === "timeline")
    return (
      <section className="panel list-panel">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">EVOLUÇÃO MUSICAL</span>
            <h2>Uma jornada ao longo dos anos</h2>
          </div>
        </div>
        {data?.years?.length ? (
          <div className="year-bars">
            {data.years.map((item) => (
              <div key={item.year} className="year-bar">
                <span>{item.year}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.max(4, (item.plays / Math.max(...data.years.map((y) => y.plays))) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{number(item.plays)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="Sem dados para formar uma linha do tempo." />
        )}
      </section>
    );
  if (page === "wrapped")
    return (
      <section className="panel wrapped-card">
        <div className="wrapped-art">
          <Sparkles size={25} />
          <span>
            SONORA
            <br />
            REWIND
          </span>
        </div>
        <div>
          <span className="panel-kicker">RECAPITULAÇÃO REAL</span>
          <div className="wrapped-title">
            <h2>Sua música em números</h2>
            <select
              value={wrappedYear}
              onChange={(event) => onWrappedYear(event.target.value)}
            >
              <option value="">Período filtrado</option>
              {(yearOptions || []).map((item) => (
                <option value={item.year} key={item.year}>
                  {item.year}
                </option>
              ))}
            </select>
          </div>
          <p>
            {number(data?.plays)} reproduções e {minutes(data?.minutes)} de
            música{" "}
            {wrappedYear ? `em ${wrappedYear}` : "no período selecionado"}.
          </p>
          <div className="wrapped-highlights">
            <span>
              <small>Artista que mais voltou</small>
              <strong>{data?.top_artist?.name || "—"}</strong>
            </span>
            <span>
              <small>Faixa da sua história</small>
              <strong>{data?.top_track?.name || "—"}</strong>
            </span>
            <span>
              <small>Álbum de destaque</small>
              <strong>{data?.top_album?.name || "—"}</strong>
            </span>
            <span>
              <small>Sequência mais longa</small>
              <strong>{number(data?.longest_streak || 0)} dias</strong>
            </span>
            <span>
              <small>Dia mais intenso</small>
              <strong>{data?.peak_day?.date || "—"}</strong>
            </span>
          </div>
          <div className="wrapped-top-five">
            <div>
              <b>Artistas</b>
              {(data?.top_artists || []).map((item) => (
                <span key={item.name}>
                  {item.name} <small>{number(item.plays)}</small>
                </span>
              ))}
            </div>
            <div>
              <b>Faixas</b>
              {(data?.top_tracks || []).map((item, index) => (
                <span key={`${item.name}-${index}`}>
                  {item.name} <small>{number(item.plays)}</small>
                </span>
              ))}
            </div>
            <div>
              <b>Álbuns</b>
              {(data?.top_albums || []).map((item, index) => (
                <span key={`${item.name}-${index}`}>
                  {item.name} <small>{number(item.plays)}</small>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  if (page === "comparisons")
    return comparison?.available ? (
      <div className="comparison-results">
        <ComparisonCard
          title="Reproduções"
          current={comparison.current.plays}
          previous={comparison.previous.plays}
          suffix="plays"
        />
        <ComparisonCard
          title="Tempo escutado"
          current={comparison.current.time_ms}
          previous={comparison.previous.time_ms}
          duration
        />
        <section className="panel comparison-note">
          <span className="panel-kicker">JANELAS COM A MESMA DURAÇÃO</span>
          <p>
            {comparison.current.from} a {comparison.current.to}
            <br />
            comparado a {comparison.previous.from} a {comparison.previous.to}
            <br />
            {number(comparison.period_days)} dias em cada período.
          </p>
        </section>
      </div>
    ) : (
      <section className="panel settings-panel">
        <div className="panel-kicker">COMPARAÇÃO</div>
        <h2>Escolha um período para comparar</h2>
        <p>
          Selecione um filtro acima para comparar essa janela com o mesmo
          intervalo imediatamente anterior. O histórico completo não tem uma
          janela anterior equivalente.
        </p>
      </section>
    );
  return (
    <div className="stats-grid comparison-cards">
      <article className="stat-card">
        <div className="stat-icon violet">
          <ArrowUpRight size={18} />
        </div>
        <span className="stat-label">Média diária</span>
        <strong>{number(data?.daily_average || 0)}</strong>
        <small>plays por dia no período</small>
      </article>
      <article className="stat-card">
        <div className="stat-icon mint">
          <ArrowDownRight size={18} />
        </div>
        <span className="stat-label">Média mensal</span>
        <strong>{number(data?.monthly_average || 0)}</strong>
        <small>plays por mês no período</small>
      </article>
      <article className="stat-card">
        <div className="stat-icon amber">
          <Headphones size={18} />
        </div>
        <span className="stat-label">Artistas diferentes</span>
        <strong>{number(data?.unique_artists || 0)}</strong>
        <small>no recorte selecionado</small>
      </article>
    </div>
  );
}
function CalendarView({ data }) {
  const [month, setMonth] = useState(() => {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }),
    [selected, setSelected] = useState(null);
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
    days = (data?.daily || []).filter((item) => item.date.startsWith(key));
  return (
    <section className="panel calendar-panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">ATIVIDADE POR DIA</span>
          <h2>
            {month.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>
        <div className="month-nav">
          <button
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
              setSelected(null);
            }}
            aria-label="Mês anterior"
          >
            ←
          </button>
          <button
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
              setSelected(null);
            }}
            aria-label="Próximo mês"
          >
            →
          </button>
        </div>
      </div>
      {days.length ? (
        <div className="calendar-grid">
          {days.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelected(day)}
              className={`calendar-day ${selected?.date === day.date ? "chosen" : ""}`}
              title={`${day.date}: ${day.plays} reproduções`}
            >
              <span>
                {new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                })}
              </span>
              <i
                style={{
                  opacity: Math.min(
                    0.25 +
                      (day.plays / Math.max(...days.map((d) => d.plays))) *
                        0.75,
                    1,
                  ),
                }}
              />
              {number(day.plays)} <small>plays</small>
            </button>
          ))}
        </div>
      ) : (
        <Empty text="Sem dias com reprodução neste mês e período." />
      )}
      {selected && (
        <div className="selected-day">
          <strong>
            {new Date(`${selected.date}T12:00:00`).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
          <span>
            {number(selected.plays)} reproduções ·{" "}
            {minutes((selected.time_ms || 0) / 60000)} escutados
          </span>
        </div>
      )}
    </section>
  );
}
function ComparisonCard({ title, current, previous, duration = false }) {
  const c = duration ? current / 60000 : current,
    p = duration ? previous / 60000 : previous,
    delta = c - p,
    pct = p ? Math.round((delta / p) * 100) : null;
  return (
    <article className="stat-card comparison-stat">
      <span className="stat-label">{title}</span>
      <strong>{duration ? minutes(c) : number(c)}</strong>
      <small>{duration ? minutes(p) : number(p)} no período anterior</small>
      <div
        className={`comparison-delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}`}
      >
        {pct === null
          ? "sem base para percentual"
          : `${delta > 0 ? "+" : ""}${number(pct)}% · ${delta > 0 ? "aumento" : delta < 0 ? "queda" : "estável"}`}
      </div>
    </article>
  );
}
function ImportView({ imports, busy, onRun }) {
  const b = imports?.last_batch;
  return (
    <>
      <section className="panel import-panel">
        <div className="import-symbol">
          <RefreshCw size={24} />
        </div>
        <div className="panel-kicker">BIBLIOTECA LOCAL</div>
        <h2>Atualize seu arquivo musical</h2>
        <p>
          A leitura usa o diretório configurado em <code>SPOTIFY_DATA_DIR</code>
          . Os JSON originais permanecem intactos e nunca são enviados para fora
          desta máquina.
        </p>
        <button className="primary-button" disabled={busy} onClick={onRun}>
          <RefreshCw size={16} className={busy ? "spin" : ""} />
          {busy ? "Importando…" : "Verificar e importar arquivos"}
        </button>
        {b && (
          <div className="import-summary">
            <div>
              <strong>{number(b.files_found ?? 0)}</strong>
              <small>arquivos encontrados</small>
            </div>
            <div>
              <strong>{number(b.files_read ?? 0)}</strong>
              <small>lidos nesta execução</small>
            </div>
            <div>
              <strong>{number(b.records_created ?? 0)}</strong>
              <small>novos eventos</small>
            </div>
            <div>
              <strong>{number(b.records_duplicate ?? 0)}</strong>
              <small>duplicados evitados</small>
            </div>
          </div>
        )}
        {b?.records_invalid > 0 && (
          <small className="import-footnote">
            Registros ignorados por data ausente ou inválida:{" "}
            {number(b.records_invalid)}.
          </small>
        )}
        <small className="import-footnote">
          Arquivos já importados são comparados por hash. Repetir a leitura não
          aumenta os totais.
        </small>
      </section>
      <section className="panel file-panel">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">ARQUIVOS DESCOBERTOS</span>
            <h2>
              {number(imports?.file_details?.length || 0)} arquivos no diretório
            </h2>
          </div>
        </div>
        {imports?.file_details?.map((file) => (
          <div className="file-row" key={file.name}>
            <div>
              <strong>{file.name}</strong>
              <small>
                {number(file.records_read)} registros ·{" "}
                {file.modified_at
                  ? new Date(file.modified_at).toLocaleDateString("pt-BR")
                  : "ainda não processado"}
              </small>
            </div>
            <span>
              {file.result === "success"
                ? "Processado"
                : file.result === "error"
                  ? "Erro"
                  : "Pendente"}
            </span>
            <small>{formatBytes(file.size_bytes)}</small>
          </div>
        ))}
      </section>
      {imports?.recent_batches?.length > 0 && (
        <section className="panel file-panel">
          <div className="panel-kicker">EXECUÇÕES RECENTES</div>
          {imports.recent_batches.slice(0, 5).map((batch, index) => (
            <div className="file-row" key={`${batch.started_at}-${index}`}>
              <div>
                <strong>
                  {new Date(batch.started_at).toLocaleString("pt-BR")}
                </strong>
                <small>
                  {number(batch.files_read)} arquivos lidos ·{" "}
                  {number(batch.records_created)} novos ·{" "}
                  {number(batch.records_duplicate)} duplicados
                </small>
              </div>
              <span>{batch.finished_at ? "Concluída" : "Em andamento"}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
function formatBytes(value = 0) {
  if (value < 1024) return `${number(value)} B`;
  if (value < 1048576)
    return `${(value / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;
  return `${(value / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}
function SettingsView({ imports, timeZone }) {
  return (
    <div className="settings-grid">
      <section className="panel settings-panel">
        <div className="panel-kicker">PRIVACIDADE</div>
        <h2>Seus dados, em casa</h2>
        <p>
          O Sonora lê os arquivos JSON diretamente do disco local. Nenhum
          histórico é enviado a serviços externos.
        </p>
        <div className="setting-row">
          <span>Gêneros</span>
          <strong>Indisponíveis no export</strong>
        </div>
        <div className="setting-row">
          <span>Fuso horário</span>
          <strong>{timeZone}</strong>
        </div>
        <div className="setting-row">
          <span>Formato de data</span>
          <strong>dd/MM/yyyy</strong>
        </div>
      </section>
      <section className="panel settings-panel">
        <div className="panel-kicker">ESTADO DA BIBLIOTECA</div>
        <h2>Banco local</h2>
        <div className="setting-row">
          <span>Arquivos registrados</span>
          <strong>{number(imports?.files || 0)}</strong>
        </div>
        <div className="setting-row">
          <span>Eventos preservados</span>
          <strong>{number(imports?.events || 0)}</strong>
        </div>
        <div className="setting-row">
          <span>Armazenamento</span>
          <strong>SQLite</strong>
        </div>
        <p className="settings-help">
          Configure o caminho do histórico e o fuso em <code>.env</code>;
          consulte o README para os comandos de inicialização e backup.
        </p>
      </section>
    </div>
  );
}
export default App;
