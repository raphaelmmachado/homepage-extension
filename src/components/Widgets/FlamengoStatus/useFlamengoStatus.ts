import { useState, useEffect } from "react";
import type {
  NextMatch,
  Championship,
  StandingsTeamRow,
  StandingsRow,
  ExtractedMatch,
  GroupTable,
} from "./types";
import {
  DEFAULT_MOCK_MATCH,
  SOFASCORE_TEAM_ID,
  FLAMENGO_LOGO_URL,
  CACHE_KEY,
  CACHE_TTL,
  TOURNAMENTS_CONFIG,
  DEFAULT_CHAMPIONSHIPS,
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

export function useFlamengoStatus() {
  const [initialData] = useState(getInitialCachedData);
  const [activeTab, setActiveTab] = useState<string>("tourn_325");
  const [champViewMode, setChampViewMode] = useState<
    Record<string, "compact" | "bracket" | "standings" | "groups">
  >({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    initialData.timestamp,
  );
  const [nextMatch, setNextMatch] = useState<NextMatch>(initialData.match);
  const [championships, setChampionships] = useState<Championship[]>(
    initialData.championships,
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
          if (parsed.timestamp) setLastUpdated(parsed.timestamp);
          const ttl = parsed.ttl || CACHE_TTL;
          if (Date.now() - parsed.timestamp < ttl) {
            return;
          }
        } catch (e) {
          console.error("Erro ao ler cache do Sofascore:", e);
        }
      }
    }

    setLoading(true);

    try {
      let fetchedMatch = { ...DEFAULT_MOCK_MATCH };

      // 1. Puxar eventos recentes e futuros do time (para garantir chaveamento e dados ao vivo)
      let allTeamEvents: ExtractedMatch[] = [];
      try {
        const { lastData, nextData } = await SportsDataClient.fetchTeamData(SOFASCORE_TEAM_ID);

        allTeamEvents = [
          ...(lastData.events || []),
          ...(nextData.events || []),
        ];

        // 1.1 Identifica se há jogo AO VIVO (inprogress) ou próximo jogo (notstarted)
        const liveEvent = allTeamEvents.find(
          (e) => e.status?.type === "inprogress",
        );
        const upcomingEvent =
          (nextData.events || []).find(
            (e: ExtractedMatch) => e.status?.type === "notstarted",
          ) || nextData.events?.[0];

        const activeEvent =
          liveEvent ||
          upcomingEvent ||
          (lastData.events && lastData.events.length > 0
            ? lastData.events[lastData.events.length - 1]
            : undefined);

        if (activeEvent) {
          const isHome = activeEvent.homeTeam?.id === SOFASCORE_TEAM_ID;
          const oppTeam = isHome ? activeEvent.awayTeam : activeEvent.homeTeam;
          const isLive = activeEvent.status?.type === "inprogress";

          const { dateStr, weekdayStr, timeStr } = formatMatchDateTime(
            activeEvent.startTimestamp,
          );

          const homeScore =
            activeEvent.homeScore?.display ?? activeEvent.homeScore?.current;
          const awayScore =
            activeEvent.awayScore?.display ?? activeEvent.awayScore?.current;

          let statusDescription = activeEvent.status?.description || "";
          const descLower = statusDescription.toLowerCase();
          if (descLower.includes("1st half") || descLower.includes("1st"))
            statusDescription = "1º Tempo";
          else if (descLower.includes("2nd half") || descLower.includes("2nd"))
            statusDescription = "2º Tempo";
          else if (descLower.includes("halftime") || descLower.includes("ht"))
            statusDescription = "Intervalo";
          else if (descLower.includes("extra"))
            statusDescription = "Prorrogação";
          else if (descLower.includes("penalt")) statusDescription = "Pênaltis";

          // Buscar detalhes do evento para pegar TV e Estádio (Venue)
          let tvChannels: string[] = [];
          let fetchedStadium = "";
          let fetchedCity = "";
          if (activeEvent.id) {
            try {
              const eventData = await SportsDataClient.fetchEventDetails(activeEvent.id);
              if (eventData) {
                const networks =
                  eventData.event?.tvNetworks ||
                  eventData.event?.media ||
                  eventData.event?.channels;
                if (Array.isArray(networks)) {
                  tvChannels = networks
                    .map(
                      (
                        tv:
                          | { tvNetwork?: { name?: string }; name?: string }
                          | string,
                      ) => {
                        if (typeof tv === "string") return tv;
                        return tv?.tvNetwork?.name || tv?.name || "";
                      },
                    )
                    .filter(Boolean);
                }

                const venue = eventData.event?.venue;
                if (venue) {
                  fetchedStadium = venue.stadium?.name || venue.name || "";
                  fetchedCity = venue.city?.name || "";
                }
              }
            } catch (e) {
              console.error("Erro ao buscar detalhes do evento:", e);
            }
          }

          const opponentName =
            oppTeam?.shortName || oppTeam?.name || "Adversário";
          const competitionName =
            activeEvent.tournament?.name || "Competição Oficial";
          const tournamentId =
            activeEvent.tournament?.uniqueTournament?.id ||
            activeEvent.tournament?.id;
          const roundName = activeEvent.roundInfo?.name;
          const roundNumber = activeEvent.roundInfo?.round;

          const { phaseType, roundOrPhase } = detectPhaseType(
            competitionName,
            roundName,
            roundNumber,
            tournamentId,
          );

          const finalTv = getBroadcastChannels(
            competitionName,
            isHome,
            opponentName,
            tvChannels,
          );

          const stadiumName =
            fetchedStadium ||
            (isHome ? "Maracanã" : getKnownStadium(opponentName)) ||
            "";

          fetchedMatch = {
            opponent: opponentName,
            opponentId: oppTeam?.id,
            opponentLogo: `https://api.sofascore.app/api/v1/team/${oppTeam?.id}/image`,
            flamengoLogo: FLAMENGO_LOGO_URL,
            date: dateStr,
            weekday: weekdayStr,
            time: timeStr,
            competition: competitionName,
            competitionId: tournamentId,
            roundOrPhase,
            phaseType,
            isHome,
            stadium: stadiumName || (isHome ? "Maracanã" : "Estádio a definir"),
            city: fetchedCity || undefined,
            tvChannels: finalTv.length > 0 ? finalTv : undefined,
            isLive,
            homeScore,
            awayScore,
            statusType: activeEvent.status?.type,
            statusDescription:
              statusDescription || (isLive ? "Em andamento" : undefined),
          };

          // Se for Liga ou Fase de Grupos, busca a tabela para garantir as posições de ambos os times
          if (phaseType === "league" || phaseType === "group") {
            const compId = tournamentId;
            if (compId) {
              try {
                const tournSeasonsRes = await fetch(
                  `https://api.sofascore.com/api/v1/unique-tournament/${compId}/seasons`,
                );
                if (tournSeasonsRes.ok) {
                  const seasonsData = await tournSeasonsRes.json();
                  const curSeason = seasonsData.seasons?.[0];
                  if (curSeason?.id) {
                    const sRes = await fetch(
                      `https://api.sofascore.com/api/v1/unique-tournament/${compId}/season/${curSeason.id}/standings/total`,
                    );
                    if (sRes.ok) {
                      const sData = await sRes.json();
                      const tables = sData.standings || [];
                      for (const tbl of tables) {
                        const allRows: StandingsRow[] = tbl.rows || [];
                        const fRow = allRows.find(
                          (r) => r.team?.id === SOFASCORE_TEAM_ID,
                        );
                        const oRow = allRows.find((r) => {
                          if (oppTeam?.id && r.team?.id === oppTeam.id)
                            return true;
                          const rName = normalizeString(
                            r.team?.shortName || r.team?.name || "",
                          );
                          const oName = normalizeString(opponentName);
                          return (
                            oName &&
                            rName &&
                            (rName.includes(oName) || oName.includes(rName))
                          );
                        });

                        if (fRow)
                          fetchedMatch.flamengoPosition = fRow.position;
                        if (oRow)
                          fetchedMatch.opponentPosition = oRow.position;
                        if (fRow && oRow) break;
                      }
                    }
                  }
                }
              } catch (e) {
                console.error(
                  "Erro ao buscar tabela para posições do próximo jogo:",
                  e,
                );
              }
            }
          }

          setNextMatch(fetchedMatch);
        }
      } catch (err) {
        console.error("Erro ao buscar eventos gerais do time:", err);
      }

      // 2. Scraping detalhado de cada Campeonato em PARALELO
      const fetchedChamps: Championship[] = await Promise.all(
        TOURNAMENTS_CONFIG.map(async (tourn): Promise<Championship> => {
          const tournamentUrl = `https://www.sofascore.com/pt/football/tournament/${tourn.region}/${tourn.slug}/${tourn.id}`;

          try {
            const seasonsRes = await fetch(
              `https://api.sofascore.com/api/v1/unique-tournament/${tourn.id}/seasons`,
            );

            if (!seasonsRes.ok) {
              return {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: "Em Disputa",
                phase: tourn.defaultPhase,
                color: tourn.defaultColor,
              };
            }

            const seasonsData = await seasonsRes.json();
            const seasons = seasonsData.seasons || [];

            if (seasons.length === 0) {
              return {
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
            let evalResult: ReturnType<typeof evaluateKnockoutStatus> | null =
              null;
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
                    ev.tournament?.uniqueTournament?.id === tourn.id,
                );
                allExtractedCupMatches.push(...directEvents);

                // Isola jogos do Flamengo para extrair confronto atual (1º e 2º jogo)
                const flaCupMatches = allExtractedCupMatches.filter(
                  (m) =>
                    m.homeTeam?.id === SOFASCORE_TEAM_ID ||
                    m.awayTeam?.id === SOFASCORE_TEAM_ID,
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

                      const dateObj = new Date(m.startTimestamp * 1000);
                      const dateStr = !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "--/--";

                      return {
                        homeTeam:
                          m.homeTeam?.shortName ||
                          m.homeTeam?.name ||
                          "Time Casa",
                        homeTeamId: m.homeTeam?.id,
                        awayTeam:
                          m.awayTeam?.shortName ||
                          m.awayTeam?.name ||
                          "Time Fora",
                        awayTeamId: m.awayTeam?.id,
                        homeScore,
                        awayScore,
                        scoreDisplay,
                        date: dateStr,
                        status: m.status?.type || "unknown",
                      };
                    }),
                  };
                }
              } catch (e) {
                console.error(
                  `Erro ao processar chaveamento de ${tourn.name}:`,
                  e,
                );
              }
            }

            // B. Busca tabelas / standings (Tabela de Liga ou Grupos de Copas como Libertadores)
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

                  // Extrair forma do Flamengo a partir dos eventos finalizados como fallback
                  const flaEventsFinished = allTeamEvents.filter(
                    (ev: ExtractedMatch) =>
                      (ev.tournament?.uniqueTournament?.id === tourn.id ||
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

                        let formList = parseForm(r.form || r.recentForm);
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
                }
              } catch {
                // Ignore standings error
              }
            }

            const defaultChamp = DEFAULT_CHAMPIONSHIPS.find(
              (dc) => dc.id === `tourn_${tourn.id}`,
            );

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
              builtChamp = {
                id: `tourn_${tourn.id}`,
                url: tournamentUrl,
                name: tourn.name,
                status: evalResult
                  ? evalResult.label
                  : defaultChamp?.status ||
                    (groupTablesList.length > 0
                      ? "Fase de Grupos"
                      : "Em Disputa"),
                phase:
                  phaseTitle ||
                  defaultChamp?.phase ||
                  (groupTablesList.length > 0
                    ? "Fase de Grupos"
                    : tourn.defaultPhase),
                color: evalResult
                  ? evalResult.badgeColor
                  : defaultChamp?.color || "bg-amber-600 text-white font-bold",
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
                knockout: knockoutObj || defaultChamp?.knockout,
              };
            }

            return (
              builtChamp || {
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
            return {
              id: `tourn_${tourn.id}`,
              url: tournamentUrl,
              name: tourn.name,
              status: "Em Disputa",
              phase: tourn.defaultPhase,
              color: tourn.defaultColor,
            };
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

        // Se o jogo está AO VIVO, cache dura 60s para tempo real!
        // Se há jogo hoje, cache dura 10 minutos.
        // Nos demais dias, cache de 24 horas.
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


  return { initialData, activeTab, setActiveTab, champViewMode, setChampViewMode, loading, lastUpdated, nextMatch, championships, fetchSofascoreData, homePos, awayPos, activeChamp, showPositions };
}
