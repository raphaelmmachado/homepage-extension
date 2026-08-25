import { useFlamengoStatus } from "./useFlamengoStatus";
import { formatMatchDateTime, resolveStadiumDisplay } from "./utils";
import { ACTIVE_CLUB, FLAMENGO_LOGO_URL } from "./constants";
import { SofascoreEmbedView } from "./SofascoreEmbedView";
import * as svgs from "../../../svgs";
import type { ExtractedMatch, StandingsRow, StandingsTeamRow } from "./types";

export function FlamengoStatus() {
  const {
    activeTab,
    setActiveTab,
    champViewMode,
    setChampViewMode,
    loading,
    lastUpdated,
    nextMatch,
    championships,
    fetchSofascoreData,
    homePos,
    awayPos,
    activeChamp,
    showPositions,
    activeClub,
  } = useFlamengoStatus();

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md transition-all mb-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={nextMatch.flamengoLogo || FLAMENGO_LOGO_URL}
            alt={activeClub.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FLAMENGO_LOGO_URL;
            }}
          />

          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <a
                href={activeClub.sofascoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activeClub.titleHeader}
              </a>
              {loading && (
                <span className="text-xs font-normal text-blue-500 animate-pulse">
                  (Atualizando dados...)
                </span>
              )}
            </h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        {/* Lado Esquerdo - Próximo Jogo */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>

          {/* Título e Campeonato Centralizado */}
          <div className="flex flex-col items-center text-center mb-4">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-400 font-bold">
              Próximo jogo
            </h3>
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1 flex items-center justify-center gap-1.5 flex-wrap">
              <span>{nextMatch.competition}</span>
              {nextMatch.roundOrPhase && (
                <>
                  <span className="text-gray-400 font-normal">•</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {nextMatch.roundOrPhase}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between my-auto">
            {/* Time da Casa */}
            <div className="flex flex-col items-center flex-1">
              {nextMatch.isHome ? (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center">
                    <img
                      src={nextMatch.flamengoLogo || FLAMENGO_LOGO_URL}
                      alt={activeClub.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FLAMENGO_LOGO_URL;
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">{activeClub.name}</span>
                  {showPositions && homePos !== undefined && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-xs">
                      {homePos}º Lugar
                    </span>
                  )}
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
                  {showPositions && homePos !== undefined && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-xs">
                      {homePos}º Lugar
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Horário e Data ou Placar Ao Vivo */}
            <div className="flex flex-col items-center px-2 sm:px-4">
              {nextMatch.isLive ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-600 text-white shadow-sm mb-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping" />
                    AO VIVO
                  </span>
                  <div className="flex items-center gap-2 text-2xl sm:text-3xl font-black text-gray-900 dark:text-white bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-3.5 py-1 rounded-lg shadow-sm">
                    <span>
                      {nextMatch.isHome
                        ? (nextMatch.homeScore ?? 0)
                        : (nextMatch.awayScore ?? 0)}
                    </span>
                    <span className="text-gray-400 text-lg font-normal">x</span>
                    <span>
                      {nextMatch.isHome
                        ? (nextMatch.awayScore ?? 0)
                        : (nextMatch.homeScore ?? 0)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1.5">
                    {nextMatch.statusDescription || "Em andamento"}
                  </span>
                  {resolveStadiumDisplay(nextMatch).stadiumName ? (
                    <span
                      className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[160px] mt-0.5"
                      title={resolveStadiumDisplay(nextMatch).stadiumName}
                    >
                      {resolveStadiumDisplay(nextMatch).stadiumName}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 whitespace-nowrap">
                    {nextMatch.weekday ? `${nextMatch.weekday}, ` : ""}
                    {nextMatch.date}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 px-3 py-1 rounded-md bg-white dark:bg-gray-800 shadow-sm whitespace-nowrap">
                    {nextMatch.time}
                  </span>
                  <div className="flex flex-col items-center mt-2 text-center max-w-[160px]">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                      {resolveStadiumDisplay(nextMatch).venueType}
                    </span>
                    {resolveStadiumDisplay(nextMatch).stadiumName ? (
                      <span
                        className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full"
                        title={resolveStadiumDisplay(nextMatch).stadiumName}
                      >
                        {resolveStadiumDisplay(nextMatch).stadiumName}
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {/* Time Visitante */}
            <div className="flex flex-col items-center flex-1">
              {!nextMatch.isHome ? (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm mb-2 flex items-center justify-center">
                    <img
                      src={nextMatch.flamengoLogo || FLAMENGO_LOGO_URL}
                      alt={activeClub.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FLAMENGO_LOGO_URL;
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">{activeClub.name}</span>
                  {showPositions && awayPos !== undefined && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-xs">
                      {awayPos}º Lugar
                    </span>
                  )}
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
                  {showPositions && awayPos !== undefined && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-xs">
                      {awayPos}º Lugar
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rodapé - Canais de Transmissão / Streaming */}
          {nextMatch.tvChannels && nextMatch.tvChannels.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200/70 dark:border-gray-700/60 flex flex-wrap items-center justify-center gap-1.5 text-xs text-center">
              <span className="font-semibold text-gray-400 dark:text-gray-400">
                Transmissão:
              </span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {nextMatch.tvChannels.join(" • ")}
              </span>
            </div>
          )}
        </div>

        {/* Lado Direito - Campeonatos */}
        <div className="flex flex-col h-full justify-between">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {championships.map((champ) => (
              <button
                key={champ.id}
                onClick={() => setActiveTab(champ.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === champ.id
                    ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-md"
                    : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {champ.name}
              </button>
            ))}
          </div>

          {/* Destaque Compacto do Campeonato Selecionado */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-h-[220px]">
            {/* Header com Status, Fase e Link */}
            <div className="w-full flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-200/60 dark:border-gray-700/50 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${activeChamp.color}`}
                >
                  {activeChamp.status}
                </span>
                {activeChamp.phase &&
                  !activeChamp.status
                    .toLowerCase()
                    .includes(activeChamp.phase.toLowerCase()) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {activeChamp.phase}
                    </span>
                  )}
              </div>

              {activeChamp.url && (
                <a
                  href={activeChamp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 shrink-0 ml-1"
                  title={`Ver ${activeChamp.name} no Sofascore`}
                >
                  <span>Sofascore</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>

            {/* Conteúdo Compacto Padrão (Sem distorção) */}
            {activeChamp.knockout ? (
              <div className="w-full flex flex-col items-center justify-center flex-1 my-auto">
                {/* Lista de Jogos (Ida e Volta) com Escudos */}
                <div className="w-full space-y-2">
                  {activeChamp.knockout.matches.map((match, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-sm"
                    >
                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                          {i === 0
                            ? "1º Jogo (Ida)"
                            : i === 1
                              ? "2º Jogo (Volta)"
                              : `Jogo ${i + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm truncate">
                          {match.homeTeamId && (
                            <img
                              src={`https://api.sofascore.app/api/v1/team/${match.homeTeamId}/image`}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                            {match.homeTeam}
                          </span>
                          <span className="text-gray-400 text-xs">x</span>
                          {match.awayTeamId && (
                            <img
                              src={`https://api.sofascore.app/api/v1/team/${match.awayTeamId}/image`}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                            {match.awayTeam}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
              <div className="w-full flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full text-xs text-left min-w-[320px]">
                  <thead>
                    <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-600/60 text-[11px]">
                      <th className="pb-1.5 font-medium w-6 text-center">#</th>
                      <th className="pb-1.5 font-medium">Time</th>
                      <th className="pb-1.5 font-semibold text-center w-7 text-gray-700 dark:text-gray-300">
                        Pts
                      </th>
                      <th className="pb-1.5 font-medium text-center w-6">J</th>
                      <th className="pb-1.5 font-medium text-center w-6">V</th>
                      <th className="pb-1.5 font-medium text-center w-8">SG</th>
                      <th className="pb-1.5 font-medium text-center w-24">
                        Forma
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeChamp.standings.map((row) => (
                      <tr
                        key={`${row.teamId}-${row.teamName}-${row.position}`}
                        className={`border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${
                          row.isFlamengo
                            ? "bg-red-50 dark:bg-red-900/25 font-bold text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/20"
                        }`}
                      >
                        <td className="py-1.5 text-center font-semibold text-[11px]">
                          {row.position}º
                        </td>
                        <td className="py-1.5">
                          <div className="flex items-center gap-1.5 truncate max-w-[100px] sm:max-w-[120px]">
                            {row.teamId && (
                              <img
                                src={`https://api.sofascore.app/api/v1/team/${row.teamId}/image`}
                                alt=""
                                className="w-3.5 h-3.5 object-contain shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                            <span className="truncate">{row.teamName}</span>
                          </div>
                        </td>
                        <td className="py-1.5 text-center font-bold text-gray-900 dark:text-gray-100">
                          {row.points}
                        </td>
                        <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">
                          {row.matches}
                        </td>
                        <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">
                          {row.wins ?? "-"}
                        </td>
                        <td
                          className={`py-1.5 text-center text-[11px] font-medium ${
                            (row.goalDiff ?? 0) > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : (row.goalDiff ?? 0) < 0
                                ? "text-rose-500 dark:text-rose-400"
                                : "text-gray-400"
                          }`}
                        >
                          {(row.goalDiff ?? 0) > 0
                            ? `+${row.goalDiff}`
                            : (row.goalDiff ?? 0)}
                        </td>
                        <td className="py-1.5">
                          <div className="flex items-center justify-center gap-0.5">
                            {row.form && row.form.length > 0 ? (
                              row.form.map((res, idx) => (
                                <span
                                  key={idx}
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-extrabold leading-none ${
                                    res === "V"
                                      ? "bg-emerald-500 text-white"
                                      : res === "E"
                                        ? "bg-gray-400 dark:bg-gray-500 text-white"
                                        : "bg-rose-500 text-white"
                                  }`}
                                  title={
                                    res === "V"
                                      ? "Vitória"
                                      : res === "E"
                                        ? "Empate"
                                        : "Derrota"
                                  }
                                >
                                  {res}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <span
                  className={`px-6 py-3 rounded-full font-bold text-base shadow-sm ${activeChamp.color}`}
                >
                  {activeChamp.status}
                </span>
              </div>
            )}

            {/* Rodapé com Ações de Expansão (Abaixo do conteúdo, estilo limpo e coerente) */}
            <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-gray-700/50 flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                {activeChamp.isLeague
                  ? "Série A"
                  : activeChamp.hasGroups
                    ? "Grupos & Mata-Mata"
                    : "Mata-Mata Eliminatório"}
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {activeChamp.isLeague && activeChamp.fullStandings && (
                  <button
                    onClick={() =>
                      setChampViewMode((prev) => ({
                        ...prev,
                        [activeChamp.id]:
                          (prev[activeChamp.id] || "compact") === "standings"
                            ? "compact"
                            : "standings",
                      }))
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>
                      {(champViewMode[activeChamp.id] || "compact") ===
                      "standings"
                        ? "Recolher tabela"
                        : "Ver tabela completa (20 times)"}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        (champViewMode[activeChamp.id] || "compact") ===
                        "standings"
                          ? "rotate-180"
                          : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}

                {activeChamp.id === "tourn_384" && (
                  <>
                    <button
                      onClick={() =>
                        setChampViewMode((prev) => ({
                          ...prev,
                          [activeChamp.id]:
                            (prev[activeChamp.id] || "compact") === "bracket"
                              ? "compact"
                              : "bracket",
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>
                        {(champViewMode[activeChamp.id] || "compact") ===
                        "bracket"
                          ? "Recolher chaveamento"
                          : "Ver chaveamento mata-mata"}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          (champViewMode[activeChamp.id] || "compact") ===
                          "bracket"
                            ? "rotate-180"
                            : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() =>
                        setChampViewMode((prev) => ({
                          ...prev,
                          [activeChamp.id]:
                            (prev[activeChamp.id] || "compact") === "groups"
                              ? "compact"
                              : "groups",
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>
                        {(champViewMode[activeChamp.id] || "compact") ===
                        "groups"
                          ? "Recolher grupos"
                          : "Ver fase de grupos"}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          (champViewMode[activeChamp.id] || "compact") ===
                          "groups"
                            ? "rotate-180"
                            : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {activeChamp.id === "tourn_373" && (
                  <button
                    onClick={() =>
                      setChampViewMode((prev) => ({
                        ...prev,
                        [activeChamp.id]:
                          (prev[activeChamp.id] || "compact") === "bracket"
                            ? "compact"
                            : "bracket",
                      }))
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>
                      {(champViewMode[activeChamp.id] || "compact") ===
                      "bracket"
                        ? "Recolher chaveamento"
                        : "Ver chaveamento completo"}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        (champViewMode[activeChamp.id] || "compact") ===
                        "bracket"
                          ? "rotate-180"
                          : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Expandida em Largura Total (Abaixo dos dois cards com Embed oficial Sofascore) */}
      {champViewMode[activeChamp.id] &&
        champViewMode[activeChamp.id] !== "compact" && (
          <div className="mt-6 pt-6 border-t border-gray-200/80 dark:border-gray-700/80 w-full animate-fadeIn">
            {activeChamp.id === "tourn_325" &&
            champViewMode[activeChamp.id] === "standings" ? (
              <SofascoreEmbedView
                type="brasileirao_standings"
                onClose={() =>
                  setChampViewMode((prev) => ({
                    ...prev,
                    [activeChamp.id]: "compact",
                  }))
                }
              />
            ) : activeChamp.id === "tourn_384" &&
              champViewMode[activeChamp.id] === "bracket" ? (
              <SofascoreEmbedView
                type="libertadores_bracket"
                onClose={() =>
                  setChampViewMode((prev) => ({
                    ...prev,
                    [activeChamp.id]: "compact",
                  }))
                }
              />
            ) : activeChamp.id === "tourn_384" &&
              champViewMode[activeChamp.id] === "groups" ? (
              <SofascoreEmbedView
                type="libertadores_groups"
                onClose={() =>
                  setChampViewMode((prev) => ({
                    ...prev,
                    [activeChamp.id]: "compact",
                  }))
                }
              />
            ) : activeChamp.id === "tourn_373" &&
              champViewMode[activeChamp.id] === "bracket" ? (
              <SofascoreEmbedView
                type="cdb_bracket"
                onClose={() =>
                  setChampViewMode((prev) => ({
                    ...prev,
                    [activeChamp.id]: "compact",
                  }))
                }
              />
            ) : null}
          </div>
        )}

      {lastUpdated && (
        <div className="text-right mt-3 text-xs text-gray-400 dark:text-gray-500">
          Atualizado em {new Date(lastUpdated).toLocaleDateString("pt-BR")} às{" "}
          {new Date(lastUpdated).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          • Atualização automática a cada 24h
        </div>
      )}
    </div>
  );
}
