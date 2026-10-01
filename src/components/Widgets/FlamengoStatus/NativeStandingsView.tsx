import React, { useState } from "react";
import type { StandingsTeamRow } from "./types";
import type { ClubConfig } from "./clubConfig";

interface NativeStandingsViewProps {
  standings?: StandingsTeamRow[];
  activeClub: ClubConfig;
  onClose?: () => void;
}

export const NativeStandingsView: React.FC<NativeStandingsViewProps> = ({
  standings = [],
  activeClub,
  onClose,
}) => {
  const [filter, setFilter] = useState<"all" | "g4" | "g6" | "sula" | "z4">("all");

  const filteredStandings = standings.filter((row) => {
    if (filter === "g4") return row.position <= 4;
    if (filter === "g6") return row.position <= 6;
    if (filter === "sula") return row.position >= 7 && row.position <= 12;
    if (filter === "z4") return row.position >= 17;
    return true;
  });

  const getPositionBadgeStyle = (pos: number) => {
    if (pos <= 4) {
      return "bg-emerald-500 text-white font-black"; // Libertadores direta (G4)
    }
    if (pos <= 6) {
      return "bg-blue-500 text-white font-bold"; // Pré-Libertadores (G6)
    }
    if (pos >= 7 && pos <= 12) {
      return "bg-amber-500 text-white font-bold"; // Sul-Americana
    }
    if (pos >= 17) {
      return "bg-rose-500 text-white font-bold"; // Rebaixamento Z4
    }
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"; // Manutenção
  };

  const getPositionIndicatorBorder = (pos: number) => {
    if (pos <= 4) return "border-l-4 border-l-emerald-500";
    if (pos <= 6) return "border-l-4 border-l-blue-500";
    if (pos >= 7 && pos <= 12) return "border-l-4 border-l-amber-500";
    if (pos >= 17) return "border-l-4 border-l-rose-500";
    return "border-l-4 border-l-transparent";
  };

  return (
    <div className="w-full flex flex-col bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs p-4 sm:p-6 animate-fadeIn">
      {/* Header com Título, Filtros e Botão Recolher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Brasileirão Série A 2026
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                20 Clubes
              </span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Classificação oficial atualizada em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Filtros Rápidos */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              Todos (20)
            </button>
            <button
              onClick={() => setFilter("g4")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "g4"
                  ? "bg-emerald-500 text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-emerald-600"
              }`}
            >
              G4
            </button>
            <button
              onClick={() => setFilter("sula")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "sula"
                  ? "bg-amber-500 text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-amber-600"
              }`}
            >
              Sula
            </button>
            <button
              onClick={() => setFilter("z4")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                filter === "z4"
                  ? "bg-rose-500 text-white shadow-xs font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-rose-600"
              }`}
            >
              Z4
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Recolher</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabela Completa Responsiva */}
      <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full text-xs text-left min-w-[620px]">
          <thead>
            <tr className="text-[11px] text-gray-400 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-2">
              <th className="pb-2.5 font-bold w-10 text-center">Pos</th>
              <th className="pb-2.5 font-bold">Clube</th>
              <th className="pb-2.5 font-extrabold text-center text-gray-800 dark:text-gray-200 w-12">Pts</th>
              <th className="pb-2.5 font-bold text-center w-10">J</th>
              <th className="pb-2.5 font-bold text-center w-10">V</th>
              <th className="pb-2.5 font-bold text-center w-10">E</th>
              <th className="pb-2.5 font-bold text-center w-10">D</th>
              <th className="pb-2.5 font-bold text-center w-10">GP</th>
              <th className="pb-2.5 font-bold text-center w-10">GC</th>
              <th className="pb-2.5 font-bold text-center w-12">SG</th>
              <th className="pb-2.5 font-bold text-center w-28">Últimos 5</th>
              <th className="pb-2.5 font-bold text-center w-14">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {filteredStandings.map((row) => {
              const isFavClub = row.isFlamengo || row.teamId === activeClub.id;
              const matchesCount = row.matches || 1;
              const pointsEarned = row.points || 0;
              const maxPoints = matchesCount * 3;
              const efficiency = Math.round((pointsEarned / maxPoints) * 100);

              return (
                <tr
                  key={row.position}
                  className={`transition-all duration-150 ${getPositionIndicatorBorder(row.position)} ${
                    isFavClub
                      ? "bg-red-50/70 dark:bg-red-950/30 font-bold hover:bg-red-100/70 dark:hover:bg-red-950/50"
                      : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                  }`}
                >
                  {/* Posição */}
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5.5 h-5.5 text-[10px] rounded-md shadow-2xs ${getPositionBadgeStyle(
                        row.position,
                      )}`}
                    >
                      {row.position}
                    </span>
                  </td>

                  {/* Clube com Escudo */}
                  <td className="py-2.5 font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700/60 p-0.5 shadow-2xs flex items-center justify-center shrink-0">
                        <img
                          src={
                            isFavClub
                              ? activeClub.badgeUrl
                              : row.teamId
                                ? `https://api.sofascore.app/api/v1/team/${row.teamId}/image`
                                : ""
                          }
                          alt={row.teamName}
                          className="w-4.5 h-4.5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className={`truncate text-xs ${isFavClub ? "font-black text-red-600 dark:text-red-400" : ""}`}>
                        {row.teamName}
                      </span>
                    </div>
                  </td>

                  {/* Pontos */}
                  <td className="py-2.5 text-center font-black text-sm text-gray-900 dark:text-white">
                    {row.points}
                  </td>

                  {/* Jogos */}
                  <td className="py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300">
                    {row.matches}
                  </td>

                  {/* Vitórias */}
                  <td className="py-2.5 text-center font-medium text-gray-600 dark:text-gray-300">
                    {row.wins ?? 0}
                  </td>

                  {/* Empates */}
                  <td className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">
                    {row.draws ?? 0}
                  </td>

                  {/* Derrotas */}
                  <td className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">
                    {row.losses ?? 0}
                  </td>

                  {/* Gols Pró */}
                  <td className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 text-[11px]">
                    {row.scoresFor ?? "-"}
                  </td>

                  {/* Gols Contra */}
                  <td className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 text-[11px]">
                    {row.scoresAgainst ?? "-"}
                  </td>

                  {/* Saldo de Gols */}
                  <td
                    className={`py-2.5 text-center font-bold text-xs ${
                      (row.goalDiff ?? 0) > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : (row.goalDiff ?? 0) < 0
                          ? "text-rose-500 dark:text-rose-400"
                          : "text-gray-400"
                    }`}
                  >
                    {(row.goalDiff ?? 0) > 0 ? `+${row.goalDiff}` : (row.goalDiff ?? 0)}
                  </td>

                  {/* Forma Recente (Últimos 5 jogos) */}
                  <td className="py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {row.form && row.form.length > 0 ? (
                        row.form.map((res, idx) => (
                          <span
                            key={idx}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black leading-none shadow-2xs ${
                              res === "V"
                                ? "bg-emerald-500 text-white"
                                : res === "E"
                                  ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
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
                        <span className="text-[10px] text-gray-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* Aproveitamento % */}
                  <td className="py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {efficiency}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda das Zonas de Classificação */}
      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>Fase de Grupos Libertadores (1º ao 4º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
            <span>Qualificação Libertadores (5º e 6º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
            <span>Fase de Grupos Sul-Americana (7º ao 12º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            <span>Rebaixamento (17º ao 20º)</span>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 font-medium">
          Critérios: Pts &gt; Vitórias &gt; Saldo de Gols &gt; Gols Pró
        </div>
      </div>
    </div>
  );
};
