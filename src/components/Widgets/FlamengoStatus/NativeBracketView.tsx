import React from "react";
import type { TournamentBracket, BracketRound, BracketMatchNode, Championship } from "./types";
import type { ClubConfig } from "./clubConfig";

interface NativeBracketViewProps {
  championship: Championship;
  activeClub: ClubConfig;
  onClose?: () => void;
}

export const NativeBracketView: React.FC<NativeBracketViewProps> = ({
  championship,
  activeClub,
  onClose,
}) => {
  const bracket: TournamentBracket = championship.bracket || {
    rounds: [
      {
        name: "Oitavas de Final",
        matches: [
          {
            id: "of1",
            homeTeam: activeClub.name,
            homeTeamId: activeClub.id,
            awayTeam: "Palmeiras",
            awayTeamId: 1963,
            homeScoreLeg1: 2,
            awayScoreLeg1: 0,
            homeScoreLeg2: 0,
            awayScoreLeg2: 1,
            homeScoreAgg: 2,
            awayScoreAgg: 1,
            scoreDisplay: "Agg: 2 - 1",
            status: "finished",
            winner: "home",
          },
          {
            id: "of2",
            homeTeam: "Bahia",
            homeTeamId: 1961,
            awayTeam: "Botafogo",
            awayTeamId: 1958,
            homeScoreLeg1: 1,
            awayScoreLeg1: 1,
            homeScoreLeg2: 1,
            awayScoreLeg2: 0,
            homeScoreAgg: 2,
            awayScoreAgg: 1,
            scoreDisplay: "Agg: 2 - 1",
            status: "finished",
            winner: "home",
          },
          {
            id: "of3",
            homeTeam: "São Paulo",
            homeTeamId: 1981,
            awayTeam: "Goiás",
            awayTeamId: 1960,
            homeScoreLeg1: 2,
            awayScoreLeg1: 0,
            homeScoreLeg2: 0,
            awayScoreLeg2: 0,
            homeScoreAgg: 2,
            awayScoreAgg: 0,
            scoreDisplay: "Agg: 2 - 0",
            status: "finished",
            winner: "home",
          },
          {
            id: "of4",
            homeTeam: "Atlético Mineiro",
            homeTeamId: 1975,
            awayTeam: "CRB",
            awayTeamId: 2013,
            homeScoreLeg1: 2,
            awayScoreLeg1: 2,
            homeScoreLeg2: 3,
            awayScoreLeg2: 0,
            homeScoreAgg: 5,
            awayScoreAgg: 2,
            scoreDisplay: "Agg: 5 - 2",
            status: "finished",
            winner: "home",
          },
        ],
      },
      {
        name: "Quartas de Final",
        matches: [
          {
            id: "qf1",
            homeTeam: "Bahia",
            homeTeamId: 1961,
            awayTeam: activeClub.name,
            awayTeamId: activeClub.id,
            homeScoreLeg1: 0,
            awayScoreLeg1: 1,
            scoreDisplay: "Ida: 0 - 1 • Volta: 12/09",
            date: "12/09/2026",
            status: "inprogress",
          },
          {
            id: "qf2",
            homeTeam: "São Paulo",
            homeTeamId: 1981,
            awayTeam: "Atlético Mineiro",
            awayTeamId: 1975,
            homeScoreLeg1: 0,
            awayScoreLeg1: 1,
            scoreDisplay: "Ida: 0 - 1 • Volta: 12/09",
            date: "12/09/2026",
            status: "inprogress",
          },
          {
            id: "qf3",
            homeTeam: "Vasco da Gama",
            homeTeamId: 1976,
            awayTeam: "Athletico-PR",
            awayTeamId: 1962,
            homeScoreLeg1: 2,
            awayScoreLeg1: 1,
            scoreDisplay: "Ida: 2 - 1 • Volta: 11/09",
            date: "11/09/2026",
            status: "inprogress",
          },
          {
            id: "qf4",
            homeTeam: "Juventude",
            homeTeamId: 1999,
            awayTeam: "Corinthians",
            awayTeamId: 1955,
            homeScoreLeg1: 2,
            awayScoreLeg1: 1,
            scoreDisplay: "Ida: 2 - 1 • Volta: 11/09",
            date: "11/09/2026",
            status: "inprogress",
          },
        ],
      },
      {
        name: "Semifinais",
        matches: [
          {
            id: "sf1",
            homeTeam: "Vencedor QF1",
            awayTeam: "Vencedor QF2",
            scoreDisplay: "A disputar",
            status: "notstarted",
          },
          {
            id: "sf2",
            homeTeam: "Vencedor QF3",
            awayTeam: "Vencedor QF4",
            scoreDisplay: "A disputar",
            status: "notstarted",
          },
        ],
      },
      {
        name: "Grande Final",
        matches: [
          {
            id: "f1",
            homeTeam: "Finalista 1",
            awayTeam: "Finalista 2",
            scoreDisplay: "Decisão do Título",
            status: "notstarted",
          },
        ],
      },
    ],
  };

  return (
    <div className="w-full flex flex-col bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs p-4 sm:p-6 animate-fadeIn">
      {/* Header do Chaveamento */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {championship.name} 2026 • Chaveamento Mata-Mata
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/40">
                Fase Eliminatória
              </span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Confrontos de Ida e Volta até a grande decisão
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-end sm:self-auto"
          >
            <span>Recolher chaveamento</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Árvore / Colunas do Chaveamento (Responsivo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
        {bracket.rounds.map((round: BracketRound, rIdx: number) => (
          <div key={rIdx} className="flex flex-col gap-3">
            {/* Header da Rodada */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs uppercase font-extrabold tracking-wider text-gray-700 dark:text-gray-200">
                {round.name}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {round.matches.length} {round.matches.length === 1 ? "jogo" : "jogos"}
              </span>
            </div>

            {/* Lista de Cards de Confronto */}
            <div className="flex flex-col gap-3 justify-around h-full">
              {round.matches.map((m: BracketMatchNode) => {
                const isHomeFav = m.homeTeamId === activeClub.id;
                const isAwayFav = m.awayTeamId === activeClub.id;
                const isFavMatch = isHomeFav || isAwayFav;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl p-3 border transition-all ${
                      isFavMatch
                        ? "bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-800/60 shadow-xs ring-1 ring-red-500/20"
                        : "bg-gray-50/80 dark:bg-gray-700/30 border-gray-200/70 dark:border-gray-700 shadow-2xs hover:bg-gray-100/50"
                    }`}
                  >
                    {/* Time Mandante */}
                    <div className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                          {m.homeTeamId ? (
                            <img
                              src={`https://api.sofascore.app/api/v1/team/${m.homeTeamId}/image`}
                              alt={m.homeTeam}
                              className="w-3.5 h-3.5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-[9px] text-gray-400 font-bold">#</span>
                          )}
                        </div>
                        <span
                          className={`text-xs truncate ${
                            m.winner === "home"
                              ? "font-extrabold text-emerald-600 dark:text-emerald-400"
                              : isHomeFav
                                ? "font-bold text-red-600 dark:text-red-400"
                                : "font-medium text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {m.homeTeam}
                        </span>
                      </div>

                      {/* Placar Agregado / Ida */}
                      <div className="flex items-center gap-1 shrink-0 font-bold text-xs">
                        {m.homeScoreAgg !== undefined ? (
                          <span
                            className={`px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                              m.winner === "home" ? "text-emerald-600 dark:text-emerald-400 font-black" : ""
                            }`}
                          >
                            {m.homeScoreAgg}
                          </span>
                        ) : m.homeScoreLeg1 !== undefined ? (
                          <span className="text-gray-700 dark:text-gray-300 font-bold">
                            {m.homeScoreLeg1}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </div>
                    </div>

                    {/* Time Visitante */}
                    <div className="flex items-center justify-between gap-2 py-1 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                          {m.awayTeamId ? (
                            <img
                              src={`https://api.sofascore.app/api/v1/team/${m.awayTeamId}/image`}
                              alt={m.awayTeam}
                              className="w-3.5 h-3.5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-[9px] text-gray-400 font-bold">#</span>
                          )}
                        </div>
                        <span
                          className={`text-xs truncate ${
                            m.winner === "away"
                              ? "font-extrabold text-emerald-600 dark:text-emerald-400"
                              : isAwayFav
                                ? "font-bold text-red-600 dark:text-red-400"
                                : "font-medium text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {m.awayTeam}
                        </span>
                      </div>

                      {/* Placar Agregado / Ida */}
                      <div className="flex items-center gap-1 shrink-0 font-bold text-xs">
                        {m.awayScoreAgg !== undefined ? (
                          <span
                            className={`px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                              m.winner === "away" ? "text-emerald-600 dark:text-emerald-400 font-black" : ""
                            }`}
                          >
                            {m.awayScoreAgg}
                          </span>
                        ) : m.awayScoreLeg1 !== undefined ? (
                          <span className="text-gray-700 dark:text-gray-300 font-bold">
                            {m.awayScoreLeg1}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </div>
                    </div>

                    {/* Rodapé do Card de Confronto */}
                    <div className="mt-1 pt-1 border-t border-gray-200/40 dark:border-gray-700/40 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="truncate">{m.scoreDisplay}</span>
                      {m.penalties && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                          {m.penalties}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
