import { useState, useEffect } from "react";

interface NextMatch {
  opponent: string;
  opponentLogo?: string;
  flamengoLogo?: string;
  date: string;
  time: string;
  competition: string;
  isHome: boolean;
  stadium: string;
}

interface KnockoutLeg {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  scoreDisplay: string;
  date: string;
  status: string;
}

interface Championship {
  id: string;
  name: string;
  status: string;
  phase: string;
  color: string;
  standings?: {
    position: number;
    teamName: string;
    points: number;
    matches: number;
    isFlamengo: boolean;
  }[];
  knockout?: {
    opponent: string;
    phaseName: string;
    matches: KnockoutLeg[];
  };
}

interface ExtractedMatch {
  id?: number;
  startTimestamp: number;
  homeTeam?: {
    id?: number;
    shortName?: string;
    name?: string;
  };
  awayTeam?: {
    id?: number;
    shortName?: string;
    name?: string;
  };
  homeScore?: {
    display?: number;
    current?: number;
  };
  awayScore?: {
    display?: number;
    current?: number;
  };
  status?: {
    type?: string;
    description?: string;
  };
  roundInfo?: {
    name?: string;
    round?: number;
    cupRoundType?: number;
  };
}

interface StandingsRow {
  position: number;
  team?: {
    id?: number;
    shortName?: string;
    name?: string;
  };
  points: number;
  matches: number;
}

const DEFAULT_MOCK_MATCH: NextMatch = {
  opponent: "Carregando...",
  date: "--/--/----",
  time: "--:--",
  competition: "Buscando...",
  isHome: true,
  stadium: "Buscando...",
};

const DEFAULT_CHAMPIONSHIPS: Championship[] = [
  {
    id: "tourn_325",
    name: "Brasileirão",
    status: "Carregando...",
    phase: "Tabela Principal",
    color: "bg-green-600",
  },
  {
    id: "tourn_386",
    name: "Carioca",
    status: "Carregando...",
    phase: "Taça Guanabara",
    color: "bg-blue-600",
  },
  {
    id: "tourn_384",
    name: "Libertadores",
    status: "Carregando...",
    phase: "Fase de Grupos",
    color: "bg-yellow-600",
  },
  {
    id: "tourn_373",
    name: "Copa do Brasil",
    status: "Carregando...",
    phase: "Mata-mata",
    color: "bg-purple-600",
  },
];

const SOFASCORE_TEAM_ID = 5981; // ID Oficial do Flamengo no Sofascore
const CACHE_KEY = "my-homepage-flamengo-sofascore-v4";
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 horas de cache

const TOURNAMENTS_CONFIG = [
  { id: 325, name: "Brasileirão", isLeague: true },
  { id: 386, name: "Carioca", isLeague: false },
  { id: 384, name: "Libertadores", isLeague: false },
  { id: 373, name: "Copa do Brasil", isLeague: false },
];

/**
 * Função recursiva para extrair todos os jogos de qualquer estrutura de chaves (cuptrees)
 */
function extractMatchesRecursively(data: any): ExtractedMatch[] {
  const list: ExtractedMatch[] = [];
  const seenIds = new Set<string>();

  function traverse(node: any) {
    if (!node || typeof node !== "object") return;

    // Detecta se o nó é um evento de partida válido
    if (node.homeTeam?.id && node.awayTeam?.id && (node.startTimestamp || node.id)) {
      const matchId = `${node.id || ""}-${node.startTimestamp || ""}-${node.homeTeam.id}-${node.awayTeam.id}`;
      if (!seenIds.has(matchId)) {
        seenIds.add(matchId);
        list.push(node as ExtractedMatch);
      }
    }

    if (node.event && node.event.homeTeam?.id && node.event.awayTeam?.id) {
      traverse(node.event);
    }

    if (Array.isArray(node.events)) {
      for (const ev of node.events) {
        traverse(ev);
      }
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
    } else {
      for (const key of Object.keys(node)) {
        if (key !== "manager" && key !== "players" && key !== "substitutions" && key !== "treeViews") {
          traverse(node[key]);
        }
      }
    }
  }

  traverse(data);
  return list;
}

function translatePhaseName(name?: string): string {
  if (!name) return "Fase Eliminatória";
  const lower = name.toLowerCase();
  if (lower.includes("round of 16") || lower.includes("oitavas")) return "Oitavas de Final";
  if (lower.includes("quarter") || lower.includes("quartas")) return "Quartas de Final";
  if (lower.includes("semi")) return "Semifinal";
  if (lower.includes("final")) return "Grande Final";
  if (lower.includes("round of 32") || lower.includes("32 avos") || lower.includes("3ª fase")) return "3ª Fase";
  return name;
}

export function FlamengoStatus() {
  const [activeTab, setActiveTab] = useState<string>("tourn_325");
  const [loading, setLoading] = useState(false);
  const [nextMatch, setNextMatch] = useState<NextMatch>(DEFAULT_MOCK_MATCH);
  const [championships, setChampionships] = useState<Championship[]>(
    DEFAULT_CHAMPIONSHIPS,
  );

  const fetchSofascoreData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.match) setNextMatch(parsed.match);
          if (parsed.championships && parsed.championships.length > 0) {
            setChampionships(parsed.championships);
          }
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            return;
          }
        } catch (e) {
          // ignore cache error
        }
      }
    }

    setLoading(true);

    try {
      let fetchedMatch = { ...DEFAULT_MOCK_MATCH };

      // 1. Puxar eventos recentes e futuros do time (para garantir chaveamento mais atual)
      let allTeamEvents: ExtractedMatch[] = [];
      try {
        const [lastRes, nextRes] = await Promise.all([
          fetch(`https://api.sofascore.com/api/v1/team/${SOFASCORE_TEAM_ID}/events/last/0`),
          fetch(`https://api.sofascore.com/api/v1/team/${SOFASCORE_TEAM_ID}/events/next/0`)
        ]);

        const lastData = lastRes.ok ? await lastRes.json() : {};
        const nextData = nextRes.ok ? await nextRes.json() : {};

        allTeamEvents = [
          ...(lastData.events || []),
          ...(nextData.events || [])
        ];

        // 1.1 Próximo Jogo Geral
        const nextEvent = nextData.events?.[0];
        if (nextEvent) {
          const isHome = nextEvent.homeTeam?.id === SOFASCORE_TEAM_ID;
          const oppTeam = isHome ? nextEvent.awayTeam : nextEvent.homeTeam;

          const dateObj = new Date(nextEvent.startTimestamp * 1000);
          const dateStr = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "A definir";
          const timeStr = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--";

          fetchedMatch = {
            opponent: oppTeam?.shortName || oppTeam?.name || "Adversário",
            opponentLogo: `https://api.sofascore.app/api/v1/team/${oppTeam?.id}/image`,
            flamengoLogo: `https://api.sofascore.app/api/v1/team/${SOFASCORE_TEAM_ID}/image`,
            date: dateStr,
            time: timeStr,
            competition: nextEvent.tournament?.name || "Competição Oficial",
            isHome,
            stadium: isHome ? "Maracanã (Mando Flamengo)" : "Fora de Casa",
          };
          setNextMatch(fetchedMatch);
        }
      } catch (err) {
        console.error("Erro ao buscar eventos gerais do time:", err);
      }

      // 2. Scraping detalhado de cada Campeonato
      const fetchedChamps: Championship[] = [];

      for (const tourn of TOURNAMENTS_CONFIG) {
        try {
          // A. Obter temporada mais recente
          const seasonsRes = await fetch(
            `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/seasons`,
          );

          if (seasonsRes.ok) {
            const seasonsData = await seasonsRes.json();
            const latestSeason = seasonsData.seasons?.[0];

            if (latestSeason?.id) {
              let builtChamp: Championship | null = null;
              let hasKnockout = false;

              // B. Se for Copa ou torneio misto (Libertadores, Copa do Brasil, Carioca), busca cuptrees PRIMEIRO
              if (!tourn.isLeague) {
                try {
                  const cupRes = await fetch(
                    `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${latestSeason.id}/cuptrees`,
                  );

                  let cupMatches: ExtractedMatch[] = [];
                  if (cupRes.ok) {
                    const cupData = await cupRes.json();
                    const extracted = extractMatchesRecursively(cupData);
                    cupMatches = extracted.filter(
                      (m) =>
                        m.homeTeam?.id === SOFASCORE_TEAM_ID ||
                        m.awayTeam?.id === SOFASCORE_TEAM_ID,
                    );
                  }

                  // Complementa com eventos diretos do time nesta competição
                  const directEvents = allTeamEvents.filter((ev: any) => 
                    ev.tournament?.uniqueTournament?.id === tourn.id ||
                    ev.season?.id === latestSeason.id
                  );

                  const combinedMatches = [...cupMatches, ...directEvents];

                  // Filtra apenas jogos do Flamengo
                  const flaCupMatches = combinedMatches.filter(
                    (m) =>
                      m.homeTeam?.id === SOFASCORE_TEAM_ID ||
                      m.awayTeam?.id === SOFASCORE_TEAM_ID,
                  );

                  if (flaCupMatches.length > 0) {
                    // Ordena por data (mais recente primeiro)
                    flaCupMatches.sort((a, b) => (b.startTimestamp || 0) - (a.startTimestamp || 0));
                    
                    const latestMatch = flaCupMatches[0]!;
                    const oppTeam =
                      latestMatch.homeTeam?.id === SOFASCORE_TEAM_ID
                        ? latestMatch.awayTeam
                        : latestMatch.homeTeam;
                    const opponentId = oppTeam?.id;
                    const opponentName = oppTeam?.shortName || oppTeam?.name || "Adversário";

                    // Pega todas as partidas contra este adversário nesta fase (Ida e Volta)
                    const roundMatches = flaCupMatches.filter(
                      (e) =>
                        (e.homeTeam?.id === opponentId && e.awayTeam?.id === SOFASCORE_TEAM_ID) ||
                        (e.awayTeam?.id === opponentId && e.homeTeam?.id === SOFASCORE_TEAM_ID),
                    );

                    // Remove possíveis duplicatas de ID
                    const uniqueLegs: ExtractedMatch[] = [];
                    const seen = new Set<string>();
                    for (const m of roundMatches) {
                      const key = `${m.startTimestamp}-${m.homeTeam?.id}`;
                      if (!seen.has(key)) {
                        seen.add(key);
                        uniqueLegs.push(m);
                      }
                    }

                    // Ordena cronologicamente (1º jogo, 2º jogo)
                    uniqueLegs.sort((a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0));

                    const phaseTitle = translatePhaseName(latestMatch.roundInfo?.name);

                    builtChamp = {
                      id: `tourn_${tourn.id}`,
                      name: tourn.name,
                      status: `vs ${opponentName}`,
                      phase: phaseTitle,
                      color: "bg-purple-600",
                      knockout: {
                        opponent: opponentName,
                        phaseName: phaseTitle,
                        matches: uniqueLegs.map((m) => {
                          const homeScore = m.homeScore?.display ?? m.homeScore?.current;
                          const awayScore = m.awayScore?.display ?? m.awayScore?.current;
                          const isFinished = m.status?.type === "finished" || m.status?.type === "ended";
                          const isInProgress = m.status?.type === "inprogress";

                          let scoreDisplay = "vs";
                          if (isFinished && homeScore !== undefined && awayScore !== undefined) {
                            scoreDisplay = `${homeScore} - ${awayScore}`;
                          } else if (isInProgress) {
                            scoreDisplay = `${homeScore ?? 0} - ${awayScore ?? 0} (Ao Vivo)`;
                          } else if (m.status?.type === "notstarted") {
                            scoreDisplay = "A disputar";
                          }

                          const dateObj = new Date(m.startTimestamp * 1000);
                          const dateStr = !isNaN(dateObj.getTime())
                            ? dateObj.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : "--/--";

                          return {
                            homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || "Time Casa",
                            awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || "Time Fora",
                            homeScore,
                            awayScore,
                            scoreDisplay,
                            date: dateStr,
                            status: m.status?.type || "unknown",
                          };
                        }),
                      },
                    };
                    hasKnockout = true;
                  }
                } catch (e) {
                  console.error(`Erro ao processar chaveamento de ${tourn.name}:`, e);
                }
              }

              // C. Se NÃO tem mata-mata ativo (ainda está na fase de grupos ou é liga como Brasileirão), busca tabela!
              if (!hasKnockout) {
                const standingsRes = await fetch(
                  `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${latestSeason.id}/standings/total`,
                );

                if (standingsRes.ok) {
                  const standingsData = await standingsRes.json();
                  const allStandings = standingsData.standings || [];

                  for (const table of allStandings) {
                    const rows = table.rows || [];
                    const flaIndex = rows.findIndex(
                      (r: unknown) =>
                        (r as { team?: { id?: number } }).team?.id ===
                        SOFASCORE_TEAM_ID,
                    );

                    if (flaIndex !== -1) {
                      const flaRow = rows[flaIndex];
                      const rank = flaRow.position;
                      const pts = flaRow.points;
                      const matches = flaRow.matches;

                      // Pegar 3 times: Flamengo e 2 próximos
                      let startIdx = Math.max(0, flaIndex - 1);
                      if (startIdx + 3 > rows.length) {
                        startIdx = Math.max(0, rows.length - 3);
                      }
                      const miniTable = rows
                        .slice(startIdx, startIdx + 3)
                        .map((r: StandingsRow) => ({
                          position: r.position,
                          teamName: r.team?.shortName || r.team?.name,
                          points: r.points,
                          matches: r.matches,
                          isFlamengo: r.team?.id === SOFASCORE_TEAM_ID,
                        }));

                      builtChamp = {
                        id: `tourn_${tourn.id}`,
                        name: tourn.name,
                        status: `${rank}º Lugar (${pts} pts)`,
                        phase: table.name
                          ? `${table.name} (${matches} jogos)`
                          : `${matches} jogos disputados`,
                        color:
                          rank <= 4
                            ? "bg-green-600"
                            : rank <= 12
                              ? "bg-blue-600"
                              : "bg-yellow-600",
                        standings: miniTable,
                      };
                      break;
                    }
                  }
                }
              }

              if (builtChamp) {
                fetchedChamps.push(builtChamp);
              } else {
                fetchedChamps.push({
                  id: `tourn_${tourn.id}`,
                  name: tourn.name,
                  status: "Em Disputa",
                  phase: latestSeason.name || "Temporada Atual",
                  color: "bg-blue-600",
                });
              }
            }
          }
        } catch (e) {
          console.error(`Erro ao buscar campeonato ${tourn.name}:`, e);
        }
      }

      const finalChamps =
        fetchedChamps.length > 0 ? fetchedChamps : DEFAULT_CHAMPIONSHIPS;
      setChampionships(finalChamps);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          match: fetchedMatch,
          championships: finalChamps,
        }),
      );
    } catch (err) {
      console.error("Erro no webscraping do Sofascore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSofascoreData();
  }, []);

  const activeChamp: Championship =
    championships.find((c) => c.id === activeTab) ||
    championships[0] ||
    DEFAULT_CHAMPIONSHIPS[0]!;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md transition-all mb-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-gray-200 dark:border-gray-600">
            <img
              src={
                nextMatch.flamengoLogo ||
                "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"
              }
              alt="Flamengo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg";
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              Status do Mengão
              {loading && (
                <span className="text-xs font-normal text-blue-500 animate-pulse">
                  (Atualizando dados...)
                </span>
              )}
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Fonte: Sofascore (Tempo Real)
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchSofascoreData(true)}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Atualizar dados agora"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado Esquerdo - Próximo Jogo */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
          <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-4">
            Próximo Jogo
          </h3>

          <div className="flex items-center justify-between my-auto">
            {/* Time da Casa */}
            <div className="flex flex-col items-center flex-1">
              {nextMatch.isHome ? (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center">
                    <img
                      src={
                        nextMatch.flamengoLogo ||
                        "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"
                      }
                      alt="Flamengo"
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg";
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">
                    Flamengo
                  </span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center overflow-hidden">
                    {nextMatch.opponentLogo ? (
                      <img
                        src={nextMatch.opponentLogo}
                        alt={nextMatch.opponent}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="font-bold text-gray-400">
                        {nextMatch.opponent.substring(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">
                    {nextMatch.opponent}
                  </span>
                </>
              )}
            </div>

            {/* Horário e Data */}
            <div className="flex flex-col items-center px-2 sm:px-4">
              <span className="text-xs font-semibold text-gray-400 mb-1">
                {nextMatch.date}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded-md bg-white dark:bg-gray-800 shadow-sm whitespace-nowrap">
                {nextMatch.time}
              </span>
              <span className="text-xs text-gray-500 mt-2 text-center max-w-[140px] truncate">
                {nextMatch.stadium}
              </span>
            </div>

            {/* Time Visitante */}
            <div className="flex flex-col items-center flex-1">
              {!nextMatch.isHome ? (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center">
                    <img
                      src={
                        nextMatch.flamengoLogo ||
                        "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"
                      }
                      alt="Flamengo"
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg";
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">
                    Flamengo
                  </span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center overflow-hidden">
                    {nextMatch.opponentLogo ? (
                      <img
                        src={nextMatch.opponentLogo}
                        alt={nextMatch.opponent}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="font-bold text-gray-400">
                        {nextMatch.opponent.substring(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">
                    {nextMatch.opponent}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 text-center">
            <span className="inline-block px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
              🏆 {nextMatch.competition}
            </span>
          </div>
        </div>

        {/* Lado Direito - Campeonatos */}
        <div className="flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {championships.map((champ) => (
              <button
                key={champ.id}
                onClick={() => setActiveTab(champ.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === champ.id
                    ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-md"
                    : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {champ.name}
              </button>
            ))}
          </div>

          {/* Destaque do Campeonato Selecionado */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[160px]">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
              {activeChamp.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {activeChamp.phase}
            </p>

            {activeChamp.knockout ? (
              <div className="w-full flex flex-col items-center">
                {/* Badge do Confronto */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white font-bold text-xs shadow-sm ${activeChamp.color}`}
                  >
                    {activeChamp.knockout.phaseName}
                  </span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    Flamengo vs {activeChamp.knockout.opponent}
                  </span>
                </div>

                {/* Lista de Jogos (Ida e Volta) */}
                <div className="w-full max-w-sm space-y-2">
                  {activeChamp.knockout.matches.map((match, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-sm"
                    >
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {i === 0 ? "1º Jogo (Ida)" : i === 1 ? "2º Jogo (Volta)" : `Jogo ${i + 1}`}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-200 truncate text-xs sm:text-sm">
                          {match.homeTeam} x {match.awayTeam}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100 whitespace-nowrap">
                          {match.scoreDisplay}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {match.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeChamp.standings ? (
              <div className="w-full max-w-sm">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-600">
                      <th className="pb-1 font-medium w-8">#</th>
                      <th className="pb-1 font-medium">Time</th>
                      <th className="pb-1 font-medium text-center">J</th>
                      <th className="pb-1 font-medium text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeChamp.standings.map((row) => (
                      <tr
                        key={row.teamName}
                        className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                          row.isFlamengo
                            ? "bg-red-50 dark:bg-red-900/20 font-bold text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        <td className="py-2">{row.position}º</td>
                        <td className="py-2 truncate max-w-[120px]">
                          {row.teamName}
                        </td>
                        <td className="py-2 text-center">{row.matches}</td>
                        <td className="py-2 text-center">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={`px-6 py-3 rounded-full text-white font-bold text-xl shadow-sm mt-auto mb-auto ${activeChamp.color}`}
              >
                {activeChamp.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
