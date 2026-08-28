import React from "react";
import type { NextMatch, MatchSummary } from "./types";
import { resolveStadiumDisplay } from "./utils";
import type { ClubConfig } from "./clubConfig";

interface MatchesScheduleStackProps {
  previousMatch: MatchSummary | null;
  nextMatch: NextMatch;
  followingMatch: MatchSummary | null;
  activeClub: ClubConfig;
  homePos?: number;
  awayPos?: number;
  showPositions: boolean;
  logoUrl: string;
}

export const MatchesScheduleStack: React.FC<MatchesScheduleStackProps> = ({
  previousMatch,
  nextMatch,
  followingMatch,
  activeClub,
  homePos,
  awayPos,
  showPositions,
  logoUrl,
}) => {
  return (
    <div className="flex flex-col gap-3 h-full justify-between">
      {/* 1. JOGO ANTERIOR */}
      {previousMatch && (
        <div className="bg-gray-50/90 dark:bg-gray-700/25 rounded-xl p-3 border border-gray-100 dark:border-gray-700/80 shadow-xs relative overflow-hidden transition-all hover:bg-gray-50 dark:hover:bg-gray-700/35">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-gray-200/50 dark:border-gray-700/50 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Último jogo
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                {previousMatch.competition}
              </span>
              {previousMatch.roundOrPhase && (
                <>
                  <span className="text-gray-400 font-normal text-[10px]">•</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] truncate">
                    {previousMatch.roundOrPhase}
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
              {previousMatch.date}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Time Mandante */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={
                    previousMatch.homeTeamId === activeClub.id
                      ? logoUrl
                      : previousMatch.homeTeamLogo ||
                        `https://api.sofascore.app/api/v1/team/${previousMatch.homeTeamId}/image`
                  }
                  alt={previousMatch.homeTeamName || "Mandante"}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoUrl;
                  }}
                />
              </div>
              <span
                className={`text-xs truncate font-medium ${
                  previousMatch.homeTeamId === activeClub.id
                    ? "font-bold text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {previousMatch.homeTeamName}
              </span>
            </div>

            {/* Placar Final */}
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 bg-white dark:bg-gray-800 rounded-md border border-gray-200/70 dark:border-gray-700 font-bold text-xs shadow-xs text-gray-800 dark:text-gray-200">
              <span>{previousMatch.homeScore ?? 0}</span>
              <span className="text-gray-400 font-normal text-[10px]">x</span>
              <span>{previousMatch.awayScore ?? 0}</span>
            </div>

            {/* Time Visitante */}
            <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0 text-right">
              <span
                className={`text-xs truncate font-medium ${
                  previousMatch.awayTeamId === activeClub.id
                    ? "font-bold text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {previousMatch.awayTeamName}
              </span>
              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={
                    previousMatch.awayTeamId === activeClub.id
                      ? logoUrl
                      : previousMatch.awayTeamLogo ||
                        `https://api.sofascore.app/api/v1/team/${previousMatch.awayTeamId}/image`
                  }
                  alt={previousMatch.awayTeamName || "Visitante"}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoUrl;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRÓXIMO JOGO (CARD PRINCIPAL) */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-4.5 border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col justify-between shadow-xs">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>

        {/* Título e Campeonato Centralizado */}
        <div className="flex flex-col items-center text-center mb-2.5">
          <span className="text-[9px] uppercase tracking-wider text-red-600 dark:text-red-400 font-extrabold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200/50 dark:border-red-800/30">
            Próximo jogo
          </span>
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
                <div className="w-12 h-12 sm:w-13 sm:h-13 bg-white dark:bg-gray-800 rounded-full p-1 shadow-xs mb-1.5 flex items-center justify-center">
                  <img
                    src={nextMatch.flamengoLogo || logoUrl}
                    alt={activeClub.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = logoUrl;
                    }}
                  />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-xs sm:text-sm">
                  {activeClub.name}
                </span>
                {showPositions && homePos !== undefined && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-2xs">
                    {homePos}º Lugar
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 sm:w-13 sm:h-13 bg-white dark:bg-gray-800 rounded-full p-1 shadow-xs mb-1.5 flex items-center justify-center overflow-hidden">
                  {nextMatch.opponentLogo ? (
                    <img
                      src={nextMatch.opponentLogo}
                      alt={nextMatch.opponent}
                      className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="font-bold text-gray-400 text-xs">
                      {nextMatch.opponent.substring(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-xs sm:text-sm">
                  {nextMatch.opponent}
                </span>
                {showPositions && homePos !== undefined && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-2xs">
                    {homePos}º Lugar
                  </span>
                )}
              </>
            )}
          </div>

          {/* Horário e Data ou Placar Ao Vivo */}
          <div className="flex flex-col items-center px-2 sm:px-3">
            {nextMatch.isLive ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white shadow-sm mb-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-ping" />
                  AO VIVO
                </span>
                <div className="flex items-center gap-2 text-xl sm:text-2xl font-black text-gray-900 dark:text-white bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-3 py-0.5 rounded-lg shadow-sm">
                  <span>
                    {nextMatch.isHome
                      ? (nextMatch.homeScore ?? 0)
                      : (nextMatch.awayScore ?? 0)}
                  </span>
                  <span className="text-gray-400 text-sm font-normal">x</span>
                  <span>
                    {nextMatch.isHome
                      ? (nextMatch.awayScore ?? 0)
                      : (nextMatch.homeScore ?? 0)}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1">
                  {nextMatch.statusDescription || "Em andamento"}
                </span>
                {resolveStadiumDisplay(nextMatch).stadiumName ? (
                  <span
                    className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[130px] mt-0.5"
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
                <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 px-2.5 py-0.5 rounded-md bg-white dark:bg-gray-800 shadow-xs whitespace-nowrap">
                  {nextMatch.time}
                </span>
                <div className="flex flex-col items-center mt-1 text-center max-w-[130px]">
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                    {resolveStadiumDisplay(nextMatch).venueType}
                  </span>
                  {resolveStadiumDisplay(nextMatch).stadiumName ? (
                    <span
                      className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full"
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
                <div className="w-12 h-12 sm:w-13 sm:h-13 bg-white dark:bg-gray-800 rounded-full p-1 shadow-xs mb-1.5 flex items-center justify-center">
                  <img
                    src={nextMatch.flamengoLogo || logoUrl}
                    alt={activeClub.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = logoUrl;
                    }}
                  />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-xs sm:text-sm">
                  {activeClub.name}
                </span>
                {showPositions && awayPos !== undefined && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-2xs">
                    {awayPos}º Lugar
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 sm:w-13 sm:h-13 bg-white dark:bg-gray-800 rounded-full p-1 shadow-xs mb-1.5 flex items-center justify-center overflow-hidden">
                  {nextMatch.opponentLogo ? (
                    <img
                      src={nextMatch.opponentLogo}
                      alt={nextMatch.opponent}
                      className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="font-bold text-gray-400 text-xs">
                      {nextMatch.opponent.substring(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-xs sm:text-sm">
                  {nextMatch.opponent}
                </span>
                {showPositions && awayPos !== undefined && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/60 shadow-2xs">
                    {awayPos}º Lugar
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Rodapé - Canais de Transmissão / Streaming */}
        {nextMatch.tvChannels && nextMatch.tvChannels.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-gray-200/70 dark:border-gray-700/60 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-center">
            <span className="font-semibold text-gray-400 dark:text-gray-400">
              Transmissão:
            </span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {nextMatch.tvChannels.join(" • ")}
            </span>
          </div>
        )}
      </div>

      {/* 3. SEGUNDO PRÓXIMO JOGO (SEGUINTE) */}
      {followingMatch && (
        <div className="bg-gray-50/90 dark:bg-gray-700/25 rounded-xl p-3 border border-gray-100 dark:border-gray-700/80 shadow-xs relative overflow-hidden transition-all hover:bg-gray-50 dark:hover:bg-gray-700/35">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-gray-200/50 dark:border-gray-700/50 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Seguinte
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                {followingMatch.competition}
              </span>
              {followingMatch.roundOrPhase && (
                <>
                  <span className="text-gray-400 font-normal text-[10px]">•</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] truncate">
                    {followingMatch.roundOrPhase}
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {followingMatch.weekday ? `${followingMatch.weekday}, ` : ""}
              {followingMatch.date} • {followingMatch.time}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Time Mandante */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={
                    followingMatch.homeTeamId === activeClub.id
                      ? logoUrl
                      : followingMatch.homeTeamLogo ||
                        `https://api.sofascore.app/api/v1/team/${followingMatch.homeTeamId}/image`
                  }
                  alt={followingMatch.homeTeamName || "Mandante"}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoUrl;
                  }}
                />
              </div>
              <span
                className={`text-xs truncate font-medium ${
                  followingMatch.homeTeamId === activeClub.id
                    ? "font-bold text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {followingMatch.homeTeamName}
              </span>
            </div>

            {/* Divisor / Estádio */}
            <div className="flex flex-col items-center justify-center px-2 shrink-0 text-center">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                vs
              </span>
              {followingMatch.stadium && (
                <span
                  className="text-[9px] text-gray-400 dark:text-gray-500 truncate max-w-[85px]"
                  title={followingMatch.stadium}
                >
                  {followingMatch.stadium}
                </span>
              )}
            </div>

            {/* Time Visitante */}
            <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0 text-right">
              <span
                className={`text-xs truncate font-medium ${
                  followingMatch.awayTeamId === activeClub.id
                    ? "font-bold text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {followingMatch.awayTeamName}
              </span>
              <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={
                    followingMatch.awayTeamId === activeClub.id
                      ? logoUrl
                      : followingMatch.awayTeamLogo ||
                        `https://api.sofascore.app/api/v1/team/${followingMatch.awayTeamId}/image`
                  }
                  alt={followingMatch.awayTeamName || "Visitante"}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoUrl;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
