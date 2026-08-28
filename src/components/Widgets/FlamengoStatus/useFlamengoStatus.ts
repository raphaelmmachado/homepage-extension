import { useState, useEffect } from "react";
import type {
  NextMatch,
  Championship,
  StandingsTeamRow,
  StandingsRow,
  ExtractedMatch,
  GroupTable,
  MatchSummary,
} from "./types";
import {
  DEFAULT_MOCK_MATCH,
  DEFAULT_PREVIOUS_MATCH,
  DEFAULT_FOLLOWING_MATCH,
  DEFAULT_PREVIOUS_MATCHES,
  DEFAULT_FOLLOWING_MATCHES,
  SOFASCORE_TEAM_ID,
  FLAMENGO_LOGO_URL,
  CACHE_KEY,
  CACHE_TTL,
  TOURNAMENTS_CONFIG,
  DEFAULT_CHAMPIONSHIPS,
  MOCK_BRASILEIRAO_STANDINGS,
} from "./constants";
import {
  extractMatchesRecursively,
  parseForm,
  formatMatchDateTime,
  getBroadcastChannels,
  getInitialCachedData,
  translatePhaseName,
  evaluateKnockoutStatus,
  getKnownStadium,
  detectPhaseType,
  normalizeString,
} from "./utils";
import { SportsDataClient } from "../../../services/SportsDataClient";
import { ACTIVE_CLUB } from "./clubConfig";

export function useFlamengoStatus() {
  const [initialData] = useState(getInitialCachedData);
  const [previousMatch, setPreviousMatch] = useState<MatchSummary | null>(
    initialData.previousMatch || DEFAULT_PREVIOUS_MATCH,
  );
  const [nextMatch, setNextMatch] = useState<NextMatch>(
    initialData.match || DEFAULT_MOCK_MATCH,
  );
  const [followingMatch, setFollowingMatch] = useState<MatchSummary | null>(
    initialData.followingMatch || DEFAULT_FOLLOWING_MATCH,
  );
  const [previousMatches, setPreviousMatches] = useState<MatchSummary[]>(
    initialData.previousMatches || DEFAULT_PREVIOUS_MATCHES,
  );
  const [followingMatches, setFollowingMatches] = useState<MatchSummary[]>(
    initialData.followingMatches || DEFAULT_FOLLOWING_MATCHES,
  );
  const [championships, setChampionships] = useState<Championship[]>(
    initialData.championships || DEFAULT_CHAMPIONSHIPS,
  );
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    initialData.timestamp,
  );
  const [activeTab, setActiveTab] = useState<string>(() => {
    return initialData.championships?.[0]?.id || "tourn_325";
  });
  const [champViewMode, setChampViewMode] = useState<
    Record<string, "compact" | "standings" | "groups" | "bracket" | "embed">
  >({});

  const fetchSofascoreData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          const ttl = parsed.ttl || CACHE_TTL;
          if (now - parsed.timestamp < ttl) {
            setNextMatch(parsed.match);
            if (parsed.previousMatch) setPreviousMatch(parsed.previousMatch);
            if (parsed.followingMatch) setFollowingMatch(parsed.followingMatch);
            if (Array.isArray(parsed.previousMatches) && parsed.previousMatches.length > 0) {
              setPreviousMatches(parsed.previousMatches);
            }
            if (Array.isArray(parsed.followingMatches) && parsed.followingMatches.length > 0) {
              setFollowingMatches(parsed.followingMatches);
            }
            setChampionships(parsed.championships);
            setLastUpdated(parsed.timestamp);
            return;
          }
        } catch {
          // Ignore cache parse error and fetch fresh data
        }
      }
    }

    setLoading(true);
    try {
      let fetchedMatch: NextMatch = DEFAULT_MOCK_MATCH;
      let previousMatchData: MatchSummary | null = previousMatch || DEFAULT_PREVIOUS_MATCH;
      let followingMatchData: MatchSummary | null = followingMatch || DEFAULT_FOLLOWING_MATCH;
      let prevMatchesList: MatchSummary[] = previousMatches.length > 0 ? previousMatches : DEFAULT_PREVIOUS_MATCHES;
      let followMatchesList: MatchSummary[] = followingMatches.length > 0 ? followingMatches : DEFAULT_FOLLOWING_MATCHES;

      const parseToMatchSummary = (
        event: ExtractedMatch,
        isFinishedMatch = false,
      ): MatchSummary => {
        const isHome = event.homeTeam?.id === SOFASCORE_TEAM_ID;
        const oppTeam = isHome ? event.awayTeam : event.homeTeam;
        const compName =
          (event.tournament as { uniqueTournament?: { name?: string; id?: number }; name?: string })?.uniqueTournament?.name ||
          (event.tournament as { name?: string })?.name ||
          "Competição";
        const compId =
          (event.tournament as { uniqueTournament?: { name?: string; id?: number } })?.uniqueTournament?.id ||
          (event.tournament as { id?: number })?.id;

        const { dateStr, weekdayStr, timeStr } = formatMatchDateTime(
          event.startTimestamp || 0,
        );

        const stadiumName =
          (event as { venue?: { stadium?: { name?: string }; name?: string } }).venue?.stadium?.name ||
          (event as { venue?: { stadium?: { name?: string }; name?: string } }).venue?.name ||
          getKnownStadium(event.homeTeam?.name || "");

        const roundNumber = event.roundInfo?.round;
        const roundName = event.roundInfo?.name;
        const { phaseType, roundOrPhase } = detectPhaseType(
          compName,
          roundName,
          roundNumber,
          compId,
        );

        return {
          id: typeof event.id === "number" ? event.id : undefined,
          opponent: oppTeam?.shortName || oppTeam?.name || "Adversário",
          opponentId: oppTeam?.id,
          opponentLogo: oppTeam?.id
            ? `https://api.sofascore.app/api/v1/team/${oppTeam.id}/image`
            : undefined,
          isHome,
          homeTeamName:
            event.homeTeam?.shortName ||
            event.homeTeam?.name ||
            (isHome ? ACTIVE_CLUB.name : "Time Mandante"),
          awayTeamName:
            event.awayTeam?.shortName ||
            event.awayTeam?.name ||
            (!isHome ? ACTIVE_CLUB.name : "Time Visitante"),
          homeTeamId: event.homeTeam?.id,
          awayTeamId: event.awayTeam?.id,
          homeTeamLogo: event.homeTeam?.id
            ? `https://api.sofascore.app/api/v1/team/${event.homeTeam.id}/image`
            : undefined,
          awayTeamLogo: event.awayTeam?.id
            ? `https://api.sofascore.app/api/v1/team/${event.awayTeam.id}/image`
            : undefined,
          date: dateStr,
          weekday: weekdayStr,
          time: timeStr,
          competition: compName,
          competitionId: compId,
          roundOrPhase,
          phaseType,
          stadium: stadiumName,
          tvChannels: getBroadcastChannels(
            compName,
            isHome,
            oppTeam?.name || "",
          ),
          isLive: event.status?.type === "inprogress",
          isFinished:
            isFinishedMatch ||
            event.status?.type === "finished" ||
            event.status?.type === "ended",
          homeScore:
            event.homeScore?.display ?? event.homeScore?.current ?? undefined,
          awayScore:
            event.awayScore?.display ?? event.awayScore?.current ?? undefined,
          statusType: event.status?.type,
          statusDescription: event.status?.description,
        };
      };

      const allTeamEvents: ExtractedMatch[] = [];

      // 1. Scraping dos Eventos do Time (Próximos e Anteriores)
      try {
        const [nextRes, lastRes] = await Promise.all([
          fetch(
            `https://api.sofascore.com/api/v1/team/${SOFASCORE_TEAM_ID}/events/next/0`,
          ),
          fetch(
            `https://api.sofascore.com/api/v1/team/${SOFASCORE_TEAM_ID}/events/last/0`,
          ),
        ]);

        let upcomingEvents: ExtractedMatch[] = [];
        let previousEvents: ExtractedMatch[] = [];

        if (nextRes.ok) {
          const nextData = await nextRes.json();
          upcomingEvents = nextData.events || [];
          allTeamEvents.push(...upcomingEvents);
        }

        if (lastRes.ok) {
          const lastData = await lastRes.json();
          previousEvents = lastData.events || [];
          allTeamEvents.push(...previousEvents);
        }

        // 1.1 Processa os Jogos Anteriores
        if (previousEvents.length > 0) {
          prevMatchesList = previousEvents.slice(0, 4).map((e) => parseToMatchSummary(e, true));
          previousMatchData = prevMatchesList[0] || DEFAULT_PREVIOUS_MATCH;
        }

        // 1.2 Processa o Próximo Jogo e os Seguintes
        const liveEvent = upcomingEvents.find(
          (e: ExtractedMatch) => e.status?.type === "inprogress",
        );
        const nextEvent =
          liveEvent ||
          upcomingEvents.find(
            (e: ExtractedMatch) => e.status?.type === "notstarted",
          ) ||
          upcomingEvents[0];

        if (nextEvent) {
          const isHome = nextEvent.homeTeam?.id === SOFASCORE_TEAM_ID;
          const opponentTeam = isHome
            ? nextEvent.awayTeam
            : nextEvent.homeTeam;
          const competitionName =
            (nextEvent.tournament as { uniqueTournament?: { name?: string; id?: number }; name?: string })?.uniqueTournament?.name ||
            (nextEvent.tournament as { name?: string })?.name ||
            "Competição";
          const compId =
            (nextEvent.tournament as { uniqueTournament?: { name?: string; id?: number } })?.uniqueTournament?.id ||
            (nextEvent.tournament as { id?: number })?.id;
          const isLive = nextEvent.status?.type === "inprogress";

          const { dateStr, weekdayStr, timeStr } = formatMatchDateTime(
            nextEvent.startTimestamp || 0,
          );

          const stadiumName =
            (nextEvent as { venue?: { stadium?: { name?: string }; name?: string } }).venue?.stadium?.name ||
            (nextEvent as { venue?: { stadium?: { name?: string }; name?: string } }).venue?.name ||
            getKnownStadium(nextEvent.homeTeam?.name || "");

          const roundNumber = nextEvent.roundInfo?.round;
          const roundName = nextEvent.roundInfo?.name;
          const { phaseType, roundOrPhase } = detectPhaseType(
            competitionName,
            roundName,
            roundNumber,
            compId,
          );

          fetchedMatch = {
            opponent:
              opponentTeam?.shortName ||
              opponentTeam?.name ||
              "Adversário",
            opponentId: opponentTeam?.id,
            opponentLogo: opponentTeam?.id
              ? `https://api.sofascore.app/api/v1/team/${opponentTeam.id}/image`
              : undefined,
            isHome,
            date: dateStr,
            weekday: weekdayStr,
            time: isLive ? "AO VIVO" : timeStr,
            competition: competitionName,
            competitionId: compId,
            stadium: stadiumName,
            tvChannels: getBroadcastChannels(
              competitionName,
              isHome,
              opponentTeam?.name || "",
            ),
            isLive,
            roundOrPhase,
            phaseType,
            statusDescription: nextEvent.status?.description,
            statusType: nextEvent.status?.type,
            homeScore:
              nextEvent.homeScore?.display ??
              nextEvent.homeScore?.current ??
              undefined,
            awayScore:
              nextEvent.awayScore?.display ??
              nextEvent.awayScore?.current ??
              undefined,
          };

          // Próximos jogos seguintes
          const nextIdx = upcomingEvents.indexOf(nextEvent);
          const followings = upcomingEvents.slice(nextIdx + 1, nextIdx + 5);
          if (followings.length > 0) {
            followMatchesList = followings.map((e) => parseToMatchSummary(e, false));
            followingMatchData = followMatchesList[0] || DEFAULT_FOLLOWING_MATCH;
          }
        }
      } catch (err) {
        console.error("Erro ao buscar eventos gerais do time:", err);
      }

      setPreviousMatch(previousMatchData);
      setFollowingMatch(followingMatchData);
      setPreviousMatches(prevMatchesList);
      setFollowingMatches(followMatchesList);

      // 2. Scraping detalhado de cada Campeonato em PARALELO
      const fetchedChamps: Championship[] = await Promise.all(
        TOURNAMENTS_CONFIG.map(async (tourn): Promise<Championship> => {
          const tournamentUrl = `https://www.sofascore.com/pt/football/tournament/${tourn.region}/${tourn.slug}/${tourn.id}`;
          const defaultChamp = DEFAULT_CHAMPIONSHIPS.find(
            (dc) => dc.id === `tourn_${tourn.id}`,
          );

          try {
            const seasonsRes = await fetch(
              `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/seasons`,
            );

            if (!seasonsRes.ok) {
              return defaultChamp || {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: "Em Disputa",
                phase: tourn.defaultPhase,
                color: tourn.defaultColor,
              };
            }

            const seasonsData = await seasonsRes.json();
            const seasons = (seasonsData.seasons || []).sort(
              (a: { year?: string; name?: string; id?: number }, b: { year?: string; name?: string; id?: number }) => {
                const is2026A =
                  a.year === "2026" ||
                  (a.name && a.name.includes("2026")) ||
                  a.id === 87678 ||
                  a.id === 87760 ||
                  a.id === 89353;
                const is2026B =
                  b.year === "2026" ||
                  (b.name && b.name.includes("2026")) ||
                  b.id === 87678 ||
                  b.id === 87760 ||
                  b.id === 89353;
                if (is2026A && !is2026B) return -1;
                if (!is2026A && is2026B) return 1;
                return 0;
              },
            );

            if (seasons.length === 0) {
              return defaultChamp || {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: "Em Disputa",
                phase: tourn.defaultPhase,
                color: tourn.defaultColor,
              };
            }

            let builtChamp: Championship | null = null;
            let knockoutObj: Championship["knockout"] | undefined = undefined;
            let evalResult: ReturnType<typeof evaluateKnockoutStatus> | null = null;
            let phaseTitle = "";
            const allExtractedCupMatches: ExtractedMatch[] = [];

            // A. Se NÃO for liga (Copas como Copa do Brasil, Libertadores), busca jogos da temporada ativa
            if (!tourn.isLeague) {
              try {
                // A.1 Varre as temporadas recentes para encontrar jogos do mata-mata
                for (const s of seasons.slice(0, 3)) {
                  try {
                    const cupRes = await fetch(
                      `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${s.id}/cuptrees`,
                    );
                    if (cupRes.ok) {
                      const cupData = await cupRes.json();
                      if (cupData.cupTrees && cupData.cupTrees.length > 0) {
                        const extracted = extractMatchesRecursively(cupData);
                        if (extracted.length > 0) {
                          allExtractedCupMatches.push(...extracted);
                          break;
                        }
                      }
                    }
                  } catch {
                    // Ignore season cuptree error
                  }
                }

                // A.2 Se não encontrou cuptree direta, busca rounds da temporada mais recente
                if (allExtractedCupMatches.length === 0) {
                  for (const s of seasons.slice(0, 2)) {
                    if (allExtractedCupMatches.length > 0) break;
                    try {
                      const roundsRes = await fetch(
                        `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${s.id}/rounds`,
                      );
                      if (roundsRes.ok) {
                        const roundsData = await roundsRes.json();
                        const rounds = roundsData.rounds || [];

                        for (
                          let i = rounds.length - 1;
                          i >= Math.max(0, rounds.length - 4);
                          i--
                        ) {
                          const r = rounds[i];
                          if (r?.round) {
                            const evRes = await fetch(
                              `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${s.id}/events/round/${r.round}`,
                            );
                            if (evRes.ok) {
                              const evData = await evRes.json();
                              const rEvents = evData.events || [];
                              allExtractedCupMatches.push(...rEvents);
                            }
                          }
                        }
                      }
                    } catch {
                      // Ignore rounds error
                    }
                  }
                }

                // A.3 Adiciona eventos diretos do time nesta competição
                const directEvents = allTeamEvents.filter(
                  (ev: ExtractedMatch) =>
                    (ev.tournament as { uniqueTournament?: { id?: number } })?.uniqueTournament?.id === tourn.id ||
                    (ev.tournament as { id?: number })?.id === tourn.id ||
                    (ev.tournament?.name &&
                      normalizeString(ev.tournament.name).includes(
                        normalizeString(tourn.name),
                      )) ||
                    (tourn.name &&
                      ev.tournament?.name &&
                      normalizeString(tourn.name).includes(
                        normalizeString(ev.tournament.name),
                      )),
                );
                allExtractedCupMatches.push(...directEvents);

                // Isola jogos do time favorito para extrair confronto atual (1º e 2º jogo)
                const flaCupMatches = allExtractedCupMatches.filter(
                  (m) =>
                    m.homeTeam?.id === SOFASCORE_TEAM_ID ||
                    m.awayTeam?.id === SOFASCORE_TEAM_ID ||
                    (m.homeTeam?.name &&
                      normalizeString(m.homeTeam.name).includes(
                        normalizeString(ACTIVE_CLUB.name),
                      )) ||
                    (m.awayTeam?.name &&
                      normalizeString(m.awayTeam.name).includes(
                        normalizeString(ACTIVE_CLUB.name),
                      )),
                );

                if (flaCupMatches.length > 0) {
                  flaCupMatches.sort(
                    (a, b) => (b.startTimestamp || 0) - (a.startTimestamp || 0),
                  );

                  const latestMatch = flaCupMatches[0]!;
                  const oppTeam =
                    latestMatch.homeTeam?.id === SOFASCORE_TEAM_ID
                      ? latestMatch.awayTeam
                      : latestMatch.homeTeam;
                  const opponentId = oppTeam?.id;
                  const opponentName =
                    oppTeam?.shortName || oppTeam?.name || "Adversário";

                  const roundMatches = flaCupMatches.filter(
                    (e) =>
                      (e.homeTeam?.id === opponentId &&
                        e.awayTeam?.id === SOFASCORE_TEAM_ID) ||
                      (e.awayTeam?.id === opponentId &&
                        e.homeTeam?.id === SOFASCORE_TEAM_ID),
                  );

                  const uniqueLegs: ExtractedMatch[] = [];
                  const seen = new Set<string>();
                  for (const m of roundMatches) {
                    const key = `${m.startTimestamp}-${m.homeTeam?.id}`;
                    if (!seen.has(key)) {
                      seen.add(key);
                      uniqueLegs.push(m);
                    }
                  }

                  uniqueLegs.sort(
                    (a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0),
                  );

                  phaseTitle = translatePhaseName(
                    latestMatch.roundInfo?.name,
                  );
                  evalResult = evaluateKnockoutStatus(
                    uniqueLegs,
                    phaseTitle,
                  );

                  knockoutObj = {
                    opponent: opponentName,
                    opponentId,
                    phaseName: phaseTitle,
                    outcome: evalResult.outcome,
                    matches: uniqueLegs.map((m) => {
                      const homeScore =
                        m.homeScore?.display ?? m.homeScore?.current;
                      const awayScore =
                        m.awayScore?.display ?? m.awayScore?.current;
                      const isFinished =
                        m.status?.type === "finished" ||
                        m.status?.type === "ended";
                      const isInProgress = m.status?.type === "inprogress";

                      let scoreDisplay = "vs";
                      if (
                        isFinished &&
                        homeScore !== undefined &&
                        awayScore !== undefined
                      ) {
                        scoreDisplay = `${homeScore} - ${awayScore}`;
                        if (
                          m.homeScore?.penalties !== undefined &&
                          m.awayScore?.penalties !== undefined
                        ) {
                          scoreDisplay += ` (${m.homeScore.penalties}x${m.awayScore.penalties} Pen)`;
                        }
                      } else if (isInProgress) {
                        scoreDisplay = `${homeScore ?? 0} - ${awayScore ?? 0} (Ao Vivo)`;
                      } else if (m.status?.type === "notstarted") {
                        scoreDisplay = "A disputar";
                      }

                      const dateObj = new Date((m.startTimestamp || 0) * 1000);
                      const dateStr = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "--/--";

                      return {
                        id: (m.id as number) || 0,
                        homeTeam:
                          m.homeTeam?.shortName ||
                          m.homeTeam?.name ||
                          "Time Mandante",
                        homeTeamId: m.homeTeam?.id,
                        awayTeam:
                          m.awayTeam?.shortName ||
                          m.awayTeam?.name ||
                          "Time Visitante",
                        awayTeamId: m.awayTeam?.id,
                        scoreDisplay,
                        date: dateStr,
                        isFinished,
                        isHome: m.homeTeam?.id === SOFASCORE_TEAM_ID,
                      };
                    }),
                  };
                }
              } catch (err) {
                console.error(
                  `Erro ao processar mata-mata do torneio ${tourn.name}:`,
                  err,
                );
              }
            }

            // B. Busca a classificação completa da tabela (Liga ou Grupos)
            let fullStandingsList: StandingsTeamRow[] = [];
            let miniStandingsList: StandingsTeamRow[] = [];
            const groupTablesList: GroupTable[] = [];
            let leagueMatchesPlayed = 0;
            let leaguePhaseName = "";
            let flaLeagueRank = 0;
            let flaLeaguePoints = 0;

            for (const s of seasons.slice(0, 3)) {
              try {
                const standingsRes = await fetch(
                  `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/season/${s.id}/standings/total`,
                );

                if (standingsRes.ok) {
                  const standingsData = await standingsRes.json();
                  const allStandings = standingsData.standings || [];

                  // Busca todos os eventos da liga para calcular com precisão a forma recente (últimos 5 jogos) de TODOS os times
                  const leagueTeamFormMap = new Map<number, string[]>();
                  try {
                    let leagueEvents: ExtractedMatch[] = [];
                    const sEventsData = await SportsDataClient.fetchSeasonEvents(tourn.id, s.id);
                    if (sEventsData && Array.isArray(sEventsData.events)) {
                      leagueEvents = sEventsData.events;
                    }

                    if (leagueEvents.length === 0) {
                      const roundsData = await SportsDataClient.fetchTournamentRounds(tourn.id, s.id);
                      const curRound =
                        (roundsData as { currentRound?: { round?: number } })?.currentRound?.round ||
                        24;

                      const targetRounds: number[] = [];
                      for (let r = Math.max(1, curRound - 6); r <= curRound + 1; r++) {
                        targetRounds.push(r);
                      }

                      const roundResults = await Promise.all(
                        targetRounds.map((rNum) =>
                          SportsDataClient.fetchRoundEvents(tourn.id, s.id, rNum)
                        )
                      );
                      for (const rr of roundResults) {
                        if (rr && Array.isArray((rr as { events?: ExtractedMatch[] }).events)) {
                          leagueEvents.push(...(rr as { events: ExtractedMatch[] }).events);
                        }
                      }
                    }

                    if (allTeamEvents.length > 0) {
                      leagueEvents.push(...allTeamEvents);
                    }

                    const finishedLeagueMatches = leagueEvents.filter(
                      (ev: ExtractedMatch) =>
                        ((ev.tournament as { uniqueTournament?: { id?: number } })?.uniqueTournament?.id === tourn.id ||
                          ev.tournament?.name?.toLowerCase().includes("brasileir") ||
                          ev.tournament?.name?.toLowerCase().includes("série a") ||
                          ev.tournament?.name?.toLowerCase().includes("serie a")) &&
                        (ev.status?.type === "finished" || ev.status?.type === "ended")
                    );

                    const uniqueFinished: ExtractedMatch[] = [];
                    const seenMatchKeys = new Set<string>();
                    for (const m of finishedLeagueMatches) {
                      const key = `${m.id || ""}-${m.startTimestamp || ""}-${m.homeTeam?.id}-${m.awayTeam?.id}`;
                      if (!seenMatchKeys.has(key)) {
                        seenMatchKeys.add(key);
                        uniqueFinished.push(m);
                      }
                    }

                    uniqueFinished.sort((a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0));

                    for (const table of allStandings) {
                      for (const row of (table.rows || [])) {
                        const tId = row.team?.id;
                        if (!tId) continue;
                        const tMatches = uniqueFinished.filter(
                          (m) => m.homeTeam?.id === tId || m.awayTeam?.id === tId
                        );
                        if (tMatches.length > 0) {
                          const f5 = tMatches.slice(-5).map((m) => {
                            const isHome = m.homeTeam?.id === tId;
                            const tScore = isHome
                              ? (m.homeScore?.display ?? m.homeScore?.current ?? 0)
                              : (m.awayScore?.display ?? m.awayScore?.current ?? 0);
                            const oScore = isHome
                              ? (m.awayScore?.display ?? m.awayScore?.current ?? 0)
                              : (m.homeScore?.display ?? m.homeScore?.current ?? 0);
                            return tScore > oScore ? "V" : tScore < oScore ? "D" : "E";
                          });
                          leagueTeamFormMap.set(tId, f5);
                        }
                      }
                    }
                  } catch (e) {
                    console.error("Erro ao processar forma dos times da liga:", e);
                  }

                  // Extrair forma do time favorito a partir dos eventos finalizados como fallback
                  const flaEventsFinished = allTeamEvents.filter(
                    (ev: ExtractedMatch) =>
                      ((ev.tournament as { uniqueTournament?: { id?: number } })?.uniqueTournament?.id === tourn.id ||
                        ev.tournament?.name
                          ?.toLowerCase()
                          .includes("brasileir")) &&
                      (ev.status?.type === "finished" ||
                        ev.status?.type === "ended"),
                  );
                  flaEventsFinished.sort(
                    (a, b) =>
                      (a.startTimestamp || 0) - (b.startTimestamp || 0),
                  );
                  const flaFallbackForm = flaEventsFinished
                    .slice(-5)
                    .map((m) => {
                      const isHome = m.homeTeam?.id === SOFASCORE_TEAM_ID;
                      const fScore = isHome
                        ? (m.homeScore?.display ??
                          m.homeScore?.current ??
                          0)
                        : (m.awayScore?.display ??
                          m.awayScore?.current ??
                          0);
                      const oScore = isHome
                        ? (m.awayScore?.display ??
                          m.awayScore?.current ??
                          0)
                        : (m.homeScore?.display ??
                          m.homeScore?.current ??
                          0);
                      return fScore > oScore ? "V" : fScore < oScore ? "D" : "E";
                    });

                  for (const table of allStandings) {
                    const rows: StandingsRow[] = table.rows || [];
                    const flaIndex = rows.findIndex(
                      (r) => r.team?.id === SOFASCORE_TEAM_ID,
                    );

                    const mappedRows: StandingsTeamRow[] = rows.map(
                      (r: StandingsRow) => {
                        const scoresFor = r.scoresFor ?? 0;
                        const scoresAgainst = r.scoresAgainst ?? 0;
                        const goalDiff = scoresFor - scoresAgainst;

                        let formList = parseForm(
                          r.form ||
                          r.recentForm ||
                          (r as unknown as Record<string, unknown>).formResults ||
                          (r as unknown as Record<string, unknown>).lastMatches
                        );

                        if (
                          formList.length === 0 &&
                          r.team?.id &&
                          leagueTeamFormMap.has(r.team.id)
                        ) {
                          formList = leagueTeamFormMap.get(r.team.id)!;
                        }

                        if (
                          formList.length === 0 &&
                          r.team?.id === SOFASCORE_TEAM_ID &&
                          flaFallbackForm.length > 0
                        ) {
                          formList = flaFallbackForm;
                        }

                        return {
                          position: r.position,
                          teamId: r.team?.id,
                          teamName:
                            r.team?.shortName || r.team?.name || "Time",
                          points: r.points,
                          matches: r.matches,
                          wins: r.wins ?? 0,
                          draws: r.draws ?? 0,
                          losses: r.losses ?? 0,
                          scoresFor,
                          scoresAgainst,
                          goalDiff,
                          form: formList,
                          isFlamengo: r.team?.id === SOFASCORE_TEAM_ID,
                        };
                      },
                    );

                    // Se a tabela tem nome de grupo (ex: "Group A", "Grupo B")
                    if (table.name) {
                      groupTablesList.push({
                        groupName: table.name,
                        rows: mappedRows,
                      });
                    }

                    if (flaIndex !== -1 && rows[flaIndex]) {
                      const flaRow = rows[flaIndex]!;
                      flaLeagueRank = flaRow.position;
                      flaLeaguePoints = flaRow.points;
                      leagueMatchesPlayed = flaRow.matches;
                      leaguePhaseName = table.name || "";
                      fullStandingsList = mappedRows;

                      // Busca o adversário na tabela completa para garantir a posição no card de próximo jogo
                      if (
                        tourn.isLeague ||
                        tourn.id === fetchedMatch.competitionId ||
                        fetchedMatch.phaseType === "league" ||
                        fetchedMatch.phaseType === "group"
                      ) {
                        fetchedMatch.flamengoPosition = flaLeagueRank;

                        const oppId = fetchedMatch.opponentId;
                        const oppNameNorm = normalizeString(
                          fetchedMatch.opponent || "",
                        );

                        const oppRow = rows.find((r: StandingsRow) => {
                          if (oppId && r.team?.id === oppId) return true;
                          const rowName = normalizeString(
                            r.team?.shortName || r.team?.name || "",
                          );
                          return (
                            oppNameNorm &&
                            rowName &&
                            (rowName.includes(oppNameNorm) ||
                              oppNameNorm.includes(rowName))
                          );
                        });

                        if (oppRow) {
                          fetchedMatch.opponentPosition = oppRow.position;
                        }
                      }

                      // Janela de 6 times: Flamengo + 5 adversários mais próximos
                      const WINDOW_SIZE = 6;
                      let startIdx = Math.max(0, flaIndex - 2);
                      if (startIdx + WINDOW_SIZE > rows.length) {
                        startIdx = Math.max(0, rows.length - WINDOW_SIZE);
                      }
                      const endIdx = Math.min(
                        rows.length,
                        startIdx + WINDOW_SIZE,
                      );

                      miniStandingsList = mappedRows.slice(startIdx, endIdx);
                    }
                  }

                  if (fullStandingsList.length > 0 || groupTablesList.length > 0) {
                    break;
                  }
                }
              } catch {
                // Ignore standings error
              }
            }

            if (tourn.isLeague) {
              builtChamp = {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: flaLeagueRank
                  ? `${flaLeagueRank}º Lugar (${flaLeaguePoints || 0} pts)`
                  : defaultChamp?.status || "Em Disputa",
                phase: leaguePhaseName
                  ? `${leaguePhaseName} (${leagueMatchesPlayed} jogos)`
                  : leagueMatchesPlayed
                    ? `${leagueMatchesPlayed} jogos disputados`
                    : defaultChamp?.phase || "Tabela Principal",
                color: "bg-emerald-600 text-white font-bold",
                isLeague: true,
                fullStandings:
                  fullStandingsList.length > 0
                    ? fullStandingsList
                    : defaultChamp?.fullStandings,
                standings:
                  miniStandingsList.length > 0
                    ? miniStandingsList
                    : defaultChamp?.standings ||
                      defaultChamp?.fullStandings?.slice(0, 6),
              };
            } else {
              const hasLiveKnockout = !!knockoutObj;
              const resolvedKnockout = knockoutObj || defaultChamp?.knockout;

              const resolvedStatus = evalResult
                ? evalResult.label
                : hasLiveKnockout && phaseTitle
                  ? phaseTitle
                  : defaultChamp?.status ||
                    (groupTablesList.length > 0
                      ? "Fase de Grupos"
                      : "Em Disputa");

              const resolvedPhase =
                phaseTitle ||
                defaultChamp?.phase ||
                (groupTablesList.length > 0
                  ? "Fase de Grupos"
                  : tourn.defaultPhase);

              const resolvedColor = evalResult
                ? evalResult.badgeColor
                : defaultChamp?.color ||
                  "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold";

              builtChamp = {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: resolvedStatus,
                phase: resolvedPhase,
                color: resolvedColor,
                isLeague: false,
                hasKnockout: true,
                hasGroups:
                  groupTablesList.length > 0 || !!defaultChamp?.groupTables,
                groupTables:
                  groupTablesList.length > 0
                    ? groupTablesList
                    : defaultChamp?.groupTables,
                standings:
                  miniStandingsList.length > 0
                    ? miniStandingsList
                    : defaultChamp?.standings,
                knockout: resolvedKnockout,
              };
            }

            return (
              builtChamp ||
              defaultChamp || {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: "Em Disputa",
                phase: seasons[0]?.name || tourn.defaultPhase,
                color: tourn.defaultColor,
              }
            );
          } catch (e) {
            console.error(`Erro ao buscar campeonato ${tourn.name}:`, e);
            return (
              defaultChamp || {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: "Em Disputa",
                phase: tourn.defaultPhase,
                color: tourn.defaultColor,
              }
            );
          }
        }),
      );

      const finalChamps =
        fetchedChamps.length > 0 ? fetchedChamps : DEFAULT_CHAMPIONSHIPS;
      setChampionships(finalChamps);

      // Enriquecer posições dos times para torneios de Liga ou Fase de Grupos
      if (
        fetchedMatch.phaseType === "league" ||
        fetchedMatch.phaseType === "group"
      ) {
        for (const champ of finalChamps) {
          if (champ.standings && champ.standings.length > 0) {
            const isMatchTourn =
              champ.id === `tourn_${fetchedMatch.competitionId}` ||
              champ.name
                .toLowerCase()
                .includes(fetchedMatch.competition.toLowerCase()) ||
              fetchedMatch.competition
                .toLowerCase()
                .includes(champ.name.toLowerCase()) ||
              fetchedMatch.phaseType === "league";

            if (isMatchTourn) {
              const flaRow = champ.standings.find(
                (r) => r.isFlamengo || r.teamId === SOFASCORE_TEAM_ID,
              );
              const oppRow = champ.standings.find(
                (r) =>
                  r.teamId === fetchedMatch.opponentId ||
                  (fetchedMatch.opponent &&
                    r.teamName
                      .toLowerCase()
                      .includes(fetchedMatch.opponent.toLowerCase())),
              );

              if (fetchedMatch.flamengoPosition === undefined && flaRow) {
                fetchedMatch.flamengoPosition = flaRow.position;
              }
              if (fetchedMatch.opponentPosition === undefined && oppRow) {
                fetchedMatch.opponentPosition = oppRow.position;
              }
            }
          }
        }
        setNextMatch(fetchedMatch);
      }

      const hasValidData =
        fetchedMatch.opponent !== DEFAULT_MOCK_MATCH.opponent ||
        fetchedChamps.some((c) => c.standings || c.knockout);

      if (hasValidData) {
        const now = Date.now();
        setLastUpdated(now);

        const isGameLive = fetchedMatch.isLive;
        const effectiveTtl = isGameLive
          ? 60 * 1000 // 1 minuto
          : CACHE_TTL; // 24 horas

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: now,
            ttl: effectiveTtl,
            match: fetchedMatch,
            previousMatch: previousMatchData,
            followingMatch: followingMatchData,
            previousMatches: prevMatchesList,
            followingMatches: followMatchesList,
            championships: finalChamps,
          }),
        );
      }
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

  // Lógica para exibição de posições dos times (apenas Liga ou Fase de Grupos)
  const showPositions =
    nextMatch.phaseType === "league" || nextMatch.phaseType === "group";

  let flaPos: number | undefined = nextMatch.flamengoPosition;
  let oppPos: number | undefined = nextMatch.opponentPosition;

  if (showPositions) {
    for (const champ of championships) {
      const rows = champ.fullStandings || champ.standings || [];
      if (rows.length === 0) continue;

      const isMatchTourn =
        (nextMatch.competitionId &&
          champ.id === `tourn_${nextMatch.competitionId}`) ||
        (nextMatch.competition &&
          (champ.name
            .toLowerCase()
            .includes(nextMatch.competition.toLowerCase()) ||
            nextMatch.competition
              .toLowerCase()
              .includes(champ.name.toLowerCase()))) ||
        (champ.isLeague &&
          nextMatch.competition?.toLowerCase().includes("brasileir"));

      if (isMatchTourn) {
        const flaRow = rows.find(
          (r) => r.isFlamengo || r.teamId === SOFASCORE_TEAM_ID,
        );
        const oppNorm = normalizeString(nextMatch.opponent || "");
        const oppRow = rows.find(
          (r) =>
            (nextMatch.opponentId && r.teamId === nextMatch.opponentId) ||
            (oppNorm &&
              (normalizeString(r.teamName).includes(oppNorm) ||
                oppNorm.includes(normalizeString(r.teamName)))),
        );

        if (flaRow) flaPos = flaRow.position;
        if (oppRow) oppPos = oppRow.position;
        break;
      }
    }
  }

  const homePos = nextMatch.isHome ? flaPos : oppPos;
  const awayPos = nextMatch.isHome ? oppPos : flaPos;

  return {
    initialData,
    activeTab,
    setActiveTab,
    champViewMode,
    setChampViewMode,
    loading,
    lastUpdated,
    previousMatch,
    nextMatch,
    followingMatch,
    previousMatches,
    followingMatches,
    championships,
    fetchSofascoreData,
    homePos,
    awayPos,
    activeChamp,
    showPositions,
    activeClub: ACTIVE_CLUB,
  };
}
