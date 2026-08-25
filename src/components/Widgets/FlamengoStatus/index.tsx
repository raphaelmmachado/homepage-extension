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
  resolveStadiumDisplay,
  getBroadcastChannels,
  getInitialCachedData,
  translatePhaseName,
  evaluateKnockoutStatus,
  getKnownStadium,
  detectPhaseType,
  normalizeString,
} from "./utils";
import { SofascoreEmbedView } from "./SofascoreEmbedView";
import { SportsDataClient } from "../../../services/SportsDataClient";

export function FlamengoStatus() {
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

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md transition-all mb-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={nextMatch.flamengoLogo || FLAMENGO_LOGO_URL}
            alt="Flamengo"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FLAMENGO_LOGO_URL;
            }}
          />

          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <a
                href="https://www.sofascore.com/pt/football/team/flamengo/5981"
                target="_blank"
                rel="noopener noreferrer"
              >
                E o Mengão, hein?
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
                      alt="Flamengo"
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FLAMENGO_LOGO_URL;
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">
                    Flamengo
                  </span>
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
                      alt="Flamengo"
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FLAMENGO_LOGO_URL;
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-center text-sm sm:text-base">
                    Flamengo
                  </span>
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
