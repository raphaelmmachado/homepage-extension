import React from "react";
import type { GroupTable } from "./types";
import type { ClubConfig } from "./clubConfig";

interface NativeGroupStageViewProps {
  groupTables?: GroupTable[];
  activeClub: ClubConfig;
  onClose?: () => void;
}

export const NativeGroupStageView: React.FC<NativeGroupStageViewProps> = ({
  groupTables = [],
  activeClub,
  onClose,
}) => {
  return (
    <div className="w-full flex flex-col bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              CONMEBOL Libertadores 2026 • Fase de Grupos
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/40">
                8 Grupos (A ao H)
              </span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              1º e 2º avançam para as Oitavas de Final • 3º disputa a Copa Sul-Americana
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-end sm:self-auto"
          >
            <span>Recolher grupos</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid de Grupos (A ao H) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {groupTables.map((gt, gIdx) => (
          <div
            key={gIdx}
            className="bg-gray-50/90 dark:bg-gray-700/30 rounded-xl p-3 sm:p-4 border border-gray-200/70 dark:border-gray-700 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/60 dark:border-gray-700/50">
              <span className="font-extrabold text-xs text-gray-900 dark:text-gray-100">
                {gt.groupName}
              </span>
              <span className="text-[10px] text-gray-400">Classificação</span>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase text-gray-400 border-b border-gray-200/40 dark:border-gray-700/40">
                  <th className="pb-1.5 text-center w-6">#</th>
                  <th className="pb-1.5 font-semibold">Clube</th>
                  <th className="pb-1.5 text-center font-bold w-8">Pts</th>
                  <th className="pb-1.5 text-center w-7">J</th>
                  <th className="pb-1.5 text-center w-8">SG</th>
                  <th className="pb-1.5 text-center w-16">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/30">
                {gt.rows.map((r) => {
                  const isFav = r.isFlamengo || r.teamId === activeClub.id;
                  return (
                    <tr
                      key={r.position}
                      className={`transition-colors ${
                        isFav
                          ? "bg-red-50/70 dark:bg-red-950/40 font-bold"
                          : "hover:bg-gray-100/50 dark:hover:bg-gray-700/40"
                      }`}
                    >
                      <td className="py-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-4.5 h-4.5 rounded text-[10px] font-bold ${
                            r.position <= 2
                              ? "bg-emerald-500 text-white"
                              : r.position === 3
                                ? "bg-amber-500 text-white"
                                : "text-gray-500"
                          }`}
                        >
                          {r.position}
                        </span>
                      </td>

                      <td className="py-2 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-1.5">
                          {r.teamId && (
                            <img
                              src={`https://api.sofascore.app/api/v1/team/${r.teamId}/image`}
                              alt={r.teamName}
                              className="w-4 h-4 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <span className={`truncate ${isFav ? "text-red-600 dark:text-red-400 font-extrabold" : ""}`}>
                            {r.teamName}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 text-center font-black text-gray-900 dark:text-white">
                        {r.points}
                      </td>

                      <td className="py-2 text-center text-gray-600 dark:text-gray-400">
                        {r.matches}
                      </td>

                      <td className="py-2 text-center font-semibold text-gray-500 dark:text-gray-400">
                        {r.goalDiff ?? 0}
                      </td>

                      <td className="py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {r.form && r.form.length > 0 ? (
                            r.form.slice(-3).map((res, idx) => (
                              <span
                                key={idx}
                                className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black ${
                                  res === "V"
                                    ? "bg-emerald-500 text-white"
                                    : res === "E"
                                      ? "bg-gray-300 text-gray-800"
                                      : "bg-rose-500 text-white"
                                }`}
                              >
                                {res}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};
