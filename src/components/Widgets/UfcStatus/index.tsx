import React, { useState, useEffect, useCallback } from "react";
import type { UfcEvent, FightMatch, Fighter } from "./types";
import { SportsDataClient } from "../../../services/SportsDataClient";
import {
  UFC_LOGO_URL,
  DEFAULT_MOCK_EVENT,
  CACHE_KEY,
  CACHE_TTL,
  SILHOUETTE_IMG,
} from "./constants";
import {
  getInitialCachedUfcData,
  parseUfcEvents,
  parseUfcSitePhotos,
  parseUfcRankingsHtml,
  isEventPassed,
} from "./utils";

export function UfcStatus() {
  const [initialData] = useState(getInitialCachedUfcData);
  const [events, setEvents] = useState<UfcEvent[]>(initialData.events);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    initialData.timestamp,
  );
  const [showFullCard, setShowFullCard] = useState<boolean>(false);
  const [cardFilter, setCardFilter] = useState<"all" | "main" | "prelims">(
    "all",
  );

  const fetchUfcData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.events && parsed.events.length > 0) {
            const upcoming = parsed.events.filter(
              (e: UfcEvent) => !isEventPassed(e.isoDate),
            );
            if (upcoming.length > 0) {
              setEvents(upcoming);
              if (parsed.timestamp) setLastUpdated(parsed.timestamp);
              const ttl = parsed.ttl || CACHE_TTL;
              // Se o cache é válido (< 7 dias) e o primeiro evento ainda não terminou, mantém o cache
              if (
                Date.now() - parsed.timestamp < ttl &&
                !isEventPassed(upcoming[0].isoDate)
              ) {
                return;
              }
            }
          }
        } catch (e) {
          console.error("Erro ao ler cache do UFC:", e);
        }
      }
    }

    setLoading(true);

    try {
      // Dates: today to 90 days in the future
      const today = new Date();
      const startStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const future = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      const endStr = future.toISOString().slice(0, 10).replace(/-/g, "");

      const { scoreboardData, rankingsData, ufcEventsHtml, ufcRankingsHtml } =
        await SportsDataClient.fetchUfcData(startStr, endStr);

      const ufcRankMap = parseUfcRankingsHtml(ufcRankingsHtml);
      const ufcPhotoMap = new Map([
        ...parseUfcSitePhotos(ufcRankingsHtml),
        ...parseUfcSitePhotos(ufcEventsHtml),
      ]);

      const parsedEvents = parseUfcEvents(
        scoreboardData,
        rankingsData,
        ufcPhotoMap,
        ufcRankMap,
      );
      const upcomingEvents = parsedEvents.filter(
        (e) => !isEventPassed(e.isoDate),
      );
      const finalEvents =
        upcomingEvents.length > 0 ? upcomingEvents : parsedEvents;

      if (finalEvents && finalEvents.length > 0) {
        setEvents(finalEvents);
        const now = Date.now();
        setLastUpdated(now);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: now,
            ttl: CACHE_TTL,
            events: finalEvents,
          }),
        );
      }
    } catch (err) {
      console.error("Erro ao atualizar dados do UFC:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUfcData();
  }, [fetchUfcData]);

  const currentEvent: UfcEvent =
    events[selectedEventIndex] || events[0] || DEFAULT_MOCK_EVENT;
  const mainEvent = currentEvent.mainEvent || currentEvent.allFights[0];
  const coMainEvent = currentEvent.coMainEvent || currentEvent.allFights[1];

  // Filter full card
  const filteredFights = currentEvent.allFights.filter((fight) => {
    if (cardFilter === "main") {
      return (
        fight.isMainEvent ||
        fight.isCoMainEvent ||
        fight.cardSegment?.toLowerCase().includes("principal") ||
        fight.cardSegment?.toLowerCase().includes("main")
      );
    }
    if (cardFilter === "prelims") {
      return (
        !fight.isMainEvent &&
        !fight.isCoMainEvent &&
        (fight.cardSegment?.toLowerCase().includes("prelim") ||
          !fight.cardSegment?.toLowerCase().includes("principal"))
      );
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md transition-all mb-6 relative">
      {/* Header do Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm p-1.5 flex-shrink-0">
            <img
              src={UFC_LOGO_URL}
              alt="UFC"
              className="w-full h-full object-contain filter brightness-0 invert"
              onError={(e) => {
                (e.target as HTMLImageElement).src = UFC_LOGO_URL;
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                <a
                  href="https://www.ufc.com.br/events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {currentEvent.title || "UFC Events"}
                </a>
              </h2>
              {currentEvent.subtitle && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {currentEvent.subtitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
              <span>
                📅{" "}
                {currentEvent.weekdayStr ? `${currentEvent.weekdayStr}, ` : ""}
                {currentEvent.dateStr}
              </span>
              <span>•</span>
              <span>⏰ {currentEvent.timeStr}</span>
              {currentEvent.venueName && (
                <>
                  <span>•</span>
                  <span>
                    📍 {currentEvent.venueName}
                    {currentEvent.city ? `, ${currentEvent.city}` : ""}
                    {currentEvent.country ? ` (${currentEvent.country})` : ""}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controles: Seletor de Eventos e Botão Atualizar */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {events.length > 1 && (
            <select
              value={selectedEventIndex}
              onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
              className="text-xs font-semibold bg-gray-100 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
            >
              {events.map((ev, idx) => (
                <option key={ev.id || idx} value={idx}>
                  {ev.dateStr} -{" "}
                  {ev.name.replace("Ultimate Fighting Championship", "UFC")}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchUfcData(true)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Atualizar dados do UFC"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin text-gray-500" : ""}`}
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
      </div>

      {/* Banner de Transmissão */}
      <div className="bg-gray-50 dark:bg-gray-700/30 border-l-2 border-gray-400 dark:border-gray-500 p-3 rounded-r-xl mb-6 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            📺 Transmissão:
          </span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {currentEvent.broadcast || "Paramount+ / UFC Fight Pass"}
          </span>
        </div>
      </div>

      {/* Destaque das 2 Principais Lutas (Main Event & Co-Main Event) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 1. Luta Principal (Main Event) */}
        {mainEvent && (
          <MainFightHighlightCard
            match={mainEvent}
            tag="LUTA PRINCIPAL"
            tagColor="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold"
            accentBorder="border-gray-200 dark:border-gray-700"
            roundsInfo="5 Rounds"
          />
        )}

        {/* 2. Luta Co-Principal (Co-Main Event) */}
        {coMainEvent && (
          <MainFightHighlightCard
            match={coMainEvent}
            tag="LUTA CO-PRINCIPAL"
            tagColor="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200
             border border-gray-200 dark:border-gray-600 font-semibold"
            accentBorder="border-gray-200 dark:border-gray-700"
            roundsInfo="3 Rounds"
          />
        )}
      </div>

      {/* Seção Card Completo de Lutas */}
      <div className="border-t border-gray-100 dark:border-gray-700/60 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFullCard((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>
                {showFullCard
                  ? "Recolher Card de Lutas"
                  : `Ver Card Completo (${currentEvent.allFights.length} lutas)`}
              </span>
            </button>

            {showFullCard && (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setCardFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    cardFilter === "all"
                      ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-xs"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  Todas ({currentEvent.allFights.length})
                </button>
                <button
                  onClick={() => setCardFilter("main")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    cardFilter === "main"
                      ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-xs"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  Card Principal
                </button>
                <button
                  onClick={() => setCardFilter("prelims")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    cardFilter === "prelims"
                      ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-xs"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  Preliminares
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid de lutas completas */}
        {showFullCard && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 animate-fadeIn">
            {filteredFights.map((fight, idx) => (
              <FightCardRow key={fight.id || idx} fight={fight} />
            ))}
          </div>
        )}
      </div>

      {/* Rodapé com timestamp de atualização */}
      {lastUpdated && (
        <div className="text-right mt-4 text-[11px] text-gray-400 dark:text-gray-500">
          Atualizado em {new Date(lastUpdated).toLocaleDateString("pt-BR")} às{" "}
          {new Date(lastUpdated).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          • Atualização automática a cada 7 dias (ou após término de cada
          evento)
        </div>
      )}
    </div>
  );
}

// Componente para Lutas Principais (Main & Co-Main)
interface MainFightHighlightProps {
  match: FightMatch;
  tag: string;
  tagColor: string;
  accentBorder: string;
  roundsInfo: string;
}

function MainFightHighlightCard({
  match,
  tag,
  tagColor,
  accentBorder,
  roundsInfo,
}: MainFightHighlightProps) {
  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 sm:p-5 border ${accentBorder} relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow`}
    >
      {/* Header do Card com Tag e Categoria */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${tagColor}`}
        >
          {tag}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span>{match.categoryPt}</span>
          <span>•</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {roundsInfo}
          </span>
        </div>
      </div>

      {/* Confronto dos Lutadores (Lado a Lado) */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 my-auto">
        {/* Lutador 1 (Corner Vermelho) */}
        <FighterHighlightProfile fighter={match.fighter1} corner="red" />

        {/* Separador Central: VS */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 px-1">
          <div className="w-8 h-8 rounded-full bg-gray-200/80 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-wider">
              VS
            </span>
          </div>
        </div>

        {/* Lutador 2 (Corner Azul) */}
        <FighterHighlightProfile fighter={match.fighter2} corner="blue" />
      </div>

      {/* Rodapé da Luta com Categoria de Peso */}
      <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
        <span>Divisão:</span>
        <span className="font-bold text-gray-800 dark:text-gray-200">
          {match.weightLimit || match.categoryPt}
        </span>
      </div>
    </div>
  );
}

// Perfil de Lutador no Card Principal
function FighterHighlightProfile({
  fighter,
  corner,
}: {
  fighter: Fighter;
  corner: "red" | "blue";
}) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* Foto com Borda do Corner e Badge de Ranking */}
      <div className="relative mb-2">
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center border-2 ${
            corner === "red"
              ? "border-rose-400 dark:border-rose-500"
              : "border-sky-400 dark:border-sky-500"
          }`}
        >
          <img
            src={fighter.headshot || SILHOUETTE_IMG}
            alt={fighter.name}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).src = SILHOUETTE_IMG;
            }}
          />
        </div>

        {/* Badge de Ranking Sobreposto na Foto */}
        {fighter.ranking && (
          <div
            className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs border ${
              fighter.ranking === "C"
                ? "bg-amber-400 text-gray-950 border-amber-300"
                : corner === "red"
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
            }`}
            title={
              fighter.ranking === "C"
                ? "Campeão da Categoria"
                : `Ranking #${fighter.ranking}`
            }
          >
            {fighter.ranking === "C" ? "👑 C" : fighter.ranking}
          </div>
        )}
      </div>

      {/* Nome do Lutador */}
      <h4
        className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate max-w-full text-center mt-0.5"
        title={fighter.name}
      >
        {fighter.name}
      </h4>

      {/* Bandeira e País */}
      <div className="flex items-center gap-1.5 mt-0.5">
        {fighter.flagUrl && (
          <img
            src={fighter.flagUrl}
            alt={fighter.country}
            className="w-4 h-3 object-contain rounded-xs shadow-xs"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium truncate">
          {fighter.country}
        </span>
      </div>
    </div>
  );
}

// Linha de Luta no Card Completo
function FightCardRow({ fight }: { fight: FightMatch }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-200/70 dark:border-gray-700/60 flex items-center justify-between gap-2.5 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-colors">
      {/* Fighter 1 (Corner Vermelho) */}
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        <FighterMiniAvatar fighter={fight.fighter1} corner="red" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {fight.fighter1.ranking && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs ${
                  fight.fighter1.ranking === "C"
                    ? "bg-amber-400 text-gray-950"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                }`}
                title={
                  fight.fighter1.ranking === "C"
                    ? "Campeão da Categoria"
                    : `Posição no Ranking: ${fight.fighter1.ranking}`
                }
              >
                {fight.fighter1.ranking === "C"
                  ? "👑 C"
                  : fight.fighter1.ranking}
              </span>
            )}
            <span
              className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate"
              title={fight.fighter1.name}
            >
              {fight.fighter1.name}
            </span>
          </div>
        </div>
      </div>

      {/* Centro: Categoria e VS */}
      <div className="flex flex-col items-center px-1 text-center flex-shrink-0 max-w-[100px]">
        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          vs
        </span>
        <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 line-clamp-1 text-center">
          {fight.categoryPt}
        </span>
        {fight.isMainEvent ? (
          <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase">
            Principal
          </span>
        ) : fight.isCoMainEvent ? (
          <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">
            Co-Main
          </span>
        ) : null}
      </div>

      {/* Fighter 2 (Corner Azul) */}
      <div className="flex-1 flex items-center justify-end gap-2.5 text-right min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            <span
              className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate"
              title={fight.fighter2.name}
            >
              {fight.fighter2.name}
            </span>
            {fight.fighter2.ranking && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs ${
                  fight.fighter2.ranking === "C"
                    ? "bg-amber-400 text-gray-950"
                    : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                }`}
                title={
                  fight.fighter2.ranking === "C"
                    ? "Campeão da Categoria"
                    : `Posição no Ranking: ${fight.fighter2.ranking}`
                }
              >
                {fight.fighter2.ranking === "C"
                  ? "👑 C"
                  : fight.fighter2.ranking}
              </span>
            )}
          </div>
        </div>
        <FighterMiniAvatar fighter={fight.fighter2} corner="blue" />
      </div>
    </div>
  );
}

function FighterMiniAvatar({
  fighter,
  corner = "red",
}: {
  fighter: Fighter;
  corner?: "red" | "blue";
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgUrl =
    !fighter.headshot || failedSrc === fighter.headshot
      ? SILHOUETTE_IMG
      : fighter.headshot;

  return (
    <div
      className={`w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center border-2 ${
        corner === "red"
          ? "border-red-500/40 dark:border-red-500/50"
          : "border-blue-500/40 dark:border-blue-500/50"
      } shadow-xs`}
    >
      <img
        src={imgUrl}
        alt={fighter.name}
        className="w-full h-full object-cover object-top scale-110 translate-y-0.5"
        onError={() => setFailedSrc(fighter.headshot || "")}
        loading="lazy"
      />
    </div>
  );
}
