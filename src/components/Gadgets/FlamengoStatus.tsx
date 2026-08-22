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

interface Championship {
  id: string;
  name: string;
  status: string;
  phase: string;
  color: string;
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
const CACHE_KEY = "my-homepage-flamengo-sofascore-v2";
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 horas de cache

const TOURNAMENTS_CONFIG = [
  { id: 325, name: "Brasileirão" },
  { id: 386, name: "Carioca" },
  { id: 384, name: "Libertadores" },
  { id: 373, name: "Copa do Brasil" },
];

export function FlamengoStatus() {
  const [activeTab, setActiveTab] = useState<string>("tourn_325");
  const [loading, setLoading] = useState(false);
  const [nextMatch, setNextMatch] = useState<NextMatch>(DEFAULT_MOCK_MATCH);
  const [championships, setChampionships] = useState<Championship[]>(DEFAULT_CHAMPIONSHIPS);

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

      // 1. Scraping Direto do Próximo Jogo no Sofascore
      try {
        const eventsRes = await fetch(
          `https://api.sofascore.com/api/v1/team/${SOFASCORE_TEAM_ID}/events/next/0`
        );

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const nextEvent = eventsData.events?.[0];

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
        }
      } catch (err) {
        console.error("Erro ao buscar próximo jogo no Sofascore:", err);
      }

      // 2. Scraping das Tabelas dos Campeonatos
      const fetchedChamps: Championship[] = [];

      for (const tourn of TOURNAMENTS_CONFIG) {
        try {
          // A. Obter temporada mais recente
          const seasonsRes = await fetch(
            `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/seasons`
          );

          if (seasonsRes.ok) {
            const seasonsData = await seasonsRes.json();
            const latestSeason = seasonsData.seasons?.[0];

            if (latestSeason?.id) {
              // B. Obter tabela de classificação da temporada
              const standingsRes = await fetch(
                `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${latestSeason.id}/standings/total`
              );

              if (standingsRes.ok) {
                const standingsData = await standingsRes.json();
                const allStandings = standingsData.standings || [];

                let foundRow = false;
                for (const table of allStandings) {
                  const rows = table.rows || [];
                  const flaRow = rows.find((r: any) => r.team?.id === SOFASCORE_TEAM_ID);

                  if (flaRow) {
                    const rank = flaRow.position;
                    const pts = flaRow.points;
                    const matches = flaRow.matches;

                    fetchedChamps.push({
                      id: `tourn_${tourn.id}`,
                      name: tourn.name,
                      status: `${rank}º Lugar (${pts} pts)`,
                      phase: table.name ? `${table.name} (${matches} jogos)` : `${matches} jogos disputados`,
                      color:
                        rank <= 4
                          ? "bg-green-600"
                          : rank <= 12
                          ? "bg-blue-600"
                          : "bg-yellow-600",
                    });
                    foundRow = true;
                    break;
                  }
                }

                if (!foundRow) {
                  // Copa ou fase mata-mata sem tabela única
                  fetchedChamps.push({
                    id: `tourn_${tourn.id}`,
                    name: tourn.name,
                    status: "Em Disputa",
                    phase: latestSeason.name || "Temporada Atual",
                    color: "bg-blue-600",
                  });
                }
              } else {
                // Sem tabela disponível no momento
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

      const finalChamps = fetchedChamps.length > 0 ? fetchedChamps : DEFAULT_CHAMPIONSHIPS;
      setChampionships(finalChamps);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          match: fetchedMatch,
          championships: finalChamps,
        })
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
              src={nextMatch.flamengoLogo || "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"} 
              alt="Flamengo" 
              className="w-8 h-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              Status do Mengão
              {loading && <span className="text-xs font-normal text-blue-500 animate-pulse">(Atualizando dados...)</span>}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
                      src={nextMatch.flamengoLogo || "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"} 
                      alt="Flamengo" 
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"; }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">Flamengo</span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center overflow-hidden">
                    {nextMatch.opponentLogo ? (
                      <img 
                        src={nextMatch.opponentLogo} 
                        alt={nextMatch.opponent} 
                        className="w-10 h-10 object-contain" 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="font-bold text-gray-400">{nextMatch.opponent.substring(0,3).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">{nextMatch.opponent}</span>
                </>
              )}
            </div>
            
            {/* Horário e Data */}
            <div className="flex flex-col items-center px-2 sm:px-4">
              <span className="text-xs font-semibold text-gray-400 mb-1">{nextMatch.date}</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded-md bg-white dark:bg-gray-800 shadow-sm whitespace-nowrap">
                {nextMatch.time}
              </span>
              <span className="text-xs text-gray-500 mt-2 text-center max-w-[140px] truncate">{nextMatch.stadium}</span>
            </div>
            
            {/* Time Visitante */}
            <div className="flex flex-col items-center flex-1">
              {!nextMatch.isHome ? (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center">
                    <img 
                      src={nextMatch.flamengoLogo || "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"} 
                      alt="Flamengo" 
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"; }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">Flamengo</span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center overflow-hidden">
                    {nextMatch.opponentLogo ? (
                      <img 
                        src={nextMatch.opponentLogo} 
                        alt={nextMatch.opponent} 
                        className="w-10 h-10 object-contain" 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="font-bold text-gray-400">{nextMatch.opponent.substring(0,3).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">{nextMatch.opponent}</span>
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
          <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center min-h-[160px]">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
              {activeChamp.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {activeChamp.phase}
            </p>
            
            <div className={`px-6 py-3 rounded-full text-white font-bold text-xl shadow-sm ${activeChamp.color}`}>
              {activeChamp.status}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
