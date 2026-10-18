import { useState, useEffect } from "react";
import type {
  NextMatch,
  Championship,
  StandingsTeamRow,
  GroupTable,
  MatchSummary,
} from "./types";
import {
  DEFAULT_MOCK_MATCH,
  DEFAULT_PREVIOUS_MATCH,
  DEFAULT_FOLLOWING_MATCH,
  DEFAULT_PREVIOUS_MATCHES,
  DEFAULT_FOLLOWING_MATCHES,
  CACHE_KEY,
  DEFAULT_CHAMPIONSHIPS,
  MOCK_BRASILEIRAO_STANDINGS,
} from "./constants";
import {
  getInitialCachedData,
  normalizeString,
  getNextScheduledUpdate,
  hasPassedScheduledUpdate,
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

  const isValidMatchDate = (m: MatchSummary | NextMatch | null | undefined): boolean => {
    if (!m) return false;
    const dateStr = m.date || "";
    if (
      dateStr.includes("2024") ||
      dateStr.includes("/24") ||
      dateStr.includes("2025") ||
      dateStr.includes("/25")
    ) {
      return false;
    }
    return true;
  };

  const fetchSofascoreData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          const isStale = parsed.ttl
            ? now - parsed.timestamp >= parsed.ttl
            : hasPassedScheduledUpdate(parsed.timestamp, now);

          if (!isStale) {
            if (parsed.match && isValidMatchDate(parsed.match)) {
              setNextMatch(parsed.match);
            }
            if (parsed.previousMatch && isValidMatchDate(parsed.previousMatch)) {
              setPreviousMatch(parsed.previousMatch);
            }
            if (parsed.followingMatch && isValidMatchDate(parsed.followingMatch)) {
              setFollowingMatch(parsed.followingMatch);
            }
            if (Array.isArray(parsed.previousMatches) && parsed.previousMatches.length > 0) {
              const validPrev = parsed.previousMatches.filter(isValidMatchDate);
              if (validPrev.length > 0) setPreviousMatches(validPrev);
            }
            if (Array.isArray(parsed.followingMatches) && parsed.followingMatches.length > 0) {
              const validFollow = parsed.followingMatches.filter(isValidMatchDate);
              if (validFollow.length > 0) setFollowingMatches(validFollow);
            }
            if (Array.isArray(parsed.championships) && parsed.championships.length > 0) {
              setChampionships(parsed.championships);
            }
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
      const clubEspnId = ACTIVE_CLUB.espnId;

      // 1. Brasileirao Standings via ESPN API
      let standingsRows: StandingsTeamRow[] = MOCK_BRASILEIRAO_STANDINGS;
      try {
        const standingsRaw = await SportsDataClient.fetchEspnStandings("bra.1");
        const rawEntries = standingsRaw?.children?.[0]?.standings?.entries || [];

        if (Array.isArray(rawEntries) && rawEntries.length > 0) {
          standingsRows = rawEntries.map((e: any) => {
            const pos = e.stats?.find((s: any) => s.name === "rank")?.value || 0;
            const pts = e.stats?.find((s: any) => s.name === "points")?.value || 0;
            const matches = e.stats?.find((s: any) => s.name === "gamesPlayed")?.value || 0;
            const wins = e.stats?.find((s: any) => s.name === "wins")?.value || 0;
            const draws = e.stats?.find((s: any) => s.name === "ties")?.value || 0;
            const losses = e.stats?.find((s: any) => s.name === "losses")?.value || 0;
            const scoresFor = e.stats?.find((s: any) => s.name === "pointsFor")?.value || 0;
            const scoresAgainst = e.stats?.find((s: any) => s.name === "pointsAgainst")?.value || 0;
            const goalDiff = scoresFor - scoresAgainst;
            const teamId = parseInt(e.team?.id, 10);
            const isFlamengo = teamId === clubEspnId;

            return {
              position: pos,
              teamId,
              teamName: e.team?.displayName || "Time",
              teamLogo: e.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`,
              points: pts,
              matches,
              wins,
              draws,
              losses,
              scoresFor,
              scoresAgainst,
              goalDiff,
              form: [] as string[],
              isFlamengo,
            };
          });
        }
      } catch (err) {
        console.warn("Aviso ao carregar tabela do Brasileirao da ESPN:", err);
      }

      // 2. Schedule: Partidas Concluidas e Forma Recente via ESPN API
      let prevMatchesList: MatchSummary[] = DEFAULT_PREVIOUS_MATCHES;
      try {
        const pastRaw = await SportsDataClient.fetchEspnTeamSchedule(clubEspnId, "bra.1", false);
        const pastEvents = (pastRaw?.events || []).filter(
          (e: any) => e.competitions?.[0]?.status?.type?.completed,
        );

        if (pastEvents.length > 0) {
          pastEvents.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Calcula forma recente (últimos 5 jogos)
          const last5 = pastEvents.slice(-5);
          const flaForm = last5.map((ev: any) => {
            const comp = ev.competitions?.[0];
            const myComp = comp?.competitors?.find((c: any) => c.team?.id === String(clubEspnId));
            const oppComp = comp?.competitors?.find((c: any) => c.team?.id !== String(clubEspnId));
            const myScore = parseInt(myComp?.score?.displayValue ?? myComp?.score?.value ?? "0", 10);
            const oppScore = parseInt(oppComp?.score?.displayValue ?? oppComp?.score?.value ?? "0", 10);
            return myScore > oppScore ? "V" : myScore < oppScore ? "D" : "E";
          });

          const myRow = standingsRows.find((r) => r.isFlamengo);
          if (myRow) {
            myRow.form = flaForm;
          }

          // Monta lista de 3 jogos anteriores mais recentes
          prevMatchesList = pastEvents
            .slice(-3)
            .reverse()
            .map((ev: any, idx: number) => {
              const comp = ev.competitions?.[0];
              const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
              const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
              const isHome = home?.team?.id === String(clubEspnId);
              const opp = isHome ? away : home;
              const d = new Date(ev.date);

              return {
                id: idx + 1,
                opponent: opp?.team?.displayName || "Adversário",
                opponentId: parseInt(opp?.team?.id || "0", 10),
                opponentLogo:
                  opp?.team?.logos?.[0]?.href ||
                  `https://a.espncdn.com/i/teamlogos/soccer/500/${opp?.team?.id}.png`,
                isHome,
                homeTeamName: home?.team?.displayName || "Mandante",
                awayTeamName: away?.team?.displayName || "Visitante",
                homeTeamId: parseInt(home?.team?.id || "0", 10),
                awayTeamId: parseInt(away?.team?.id || "0", 10),
                homeTeamLogo:
                  home?.team?.logos?.[0]?.href ||
                  `https://a.espncdn.com/i/teamlogos/soccer/500/${home?.team?.id}.png`,
                awayTeamLogo:
                  away?.team?.logos?.[0]?.href ||
                  `https://a.espncdn.com/i/teamlogos/soccer/500/${away?.team?.id}.png`,
                date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                weekday: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()],
                time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                competition: "Brasileirão",
                roundOrPhase: "Série A",
                phaseType: "league" as const,
                stadium: comp?.venue?.fullName || "",
                isFinished: true,
                homeScore: parseInt(home?.score?.displayValue ?? "0", 10),
                awayScore: parseInt(away?.score?.displayValue ?? "0", 10),
                statusType: "finished",
                statusDescription: "Encerrado",
              };
            });
        }
      } catch (err) {
        console.warn("Aviso ao carregar jogos anteriores da ESPN:", err);
      }

      // 3. Fixtures: Próximo Jogo e Jogos Seguintes via ESPN API
      let fetchedMatch: NextMatch = DEFAULT_MOCK_MATCH;
      let followMatchesList: MatchSummary[] = DEFAULT_FOLLOWING_MATCHES;
      try {
        const futureRaw = await SportsDataClient.fetchEspnTeamSchedule(clubEspnId, "bra.1", true);
        const futureEvents = futureRaw?.events || [];

        if (futureEvents.length > 0) {
          futureEvents.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const nextEv = futureEvents[0];
          const comp = nextEv.competitions?.[0];
          const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
          const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
          const isHome = home?.team?.id === String(clubEspnId);
          const opp = isHome ? away : home;
          const oppId = parseInt(opp?.team?.id || "0", 10);
          const d = new Date(nextEv.date);
          const flaRow = standingsRows.find((r) => r.isFlamengo);

          fetchedMatch = {
            opponent: opp?.team?.displayName || "Adversário",
            opponentId: oppId,
            opponentLogo:
              opp?.team?.logos?.[0]?.href ||
              `https://a.espncdn.com/i/teamlogos/soccer/500/${oppId}.png`,
            date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            weekday: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()],
            time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            competition: "Brasileirão",
            roundOrPhase: "Série A",
            phaseType: "league",
            flamengoPosition: flaRow?.position || 2,
            opponentPosition: standingsRows.find((r) => r.teamId === oppId)?.position,
            isHome,
            stadium: comp?.venue?.fullName || "",
            tvChannels: ["Premiere", "Globo"],
            isLive: comp?.status?.type?.state === "in",
            homeScore: home?.score ? parseInt(home.score.displayValue ?? home.score.value ?? "0", 10) : undefined,
            awayScore: away?.score ? parseInt(away.score.displayValue ?? away.score.value ?? "0", 10) : undefined,
          };

          const upcomingSlice = futureEvents.slice(1, 4);
          if (upcomingSlice.length > 0) {
            followMatchesList = upcomingSlice.map((ev: any, idx: number) => {
              const c = ev.competitions?.[0];
              const h = c?.competitors?.find((x: any) => x.homeAway === "home");
              const a = c?.competitors?.find((x: any) => x.homeAway === "away");
              const ih = h?.team?.id === String(clubEspnId);
              const o = ih ? a : h;
              const dt = new Date(ev.date);
              const oId = parseInt(o?.team?.id || "0", 10);

              return {
                id: idx + 10,
                opponent: o?.team?.displayName || "Adversário",
                opponentId: oId,
                opponentLogo:
                  o?.team?.logos?.[0]?.href ||
                  `https://a.espncdn.com/i/teamlogos/soccer/500/${oId}.png`,
                isHome: ih,
                homeTeamName: h?.team?.displayName || "Mandante",
                awayTeamName: a?.team?.displayName || "Visitante",
                homeTeamId: parseInt(h?.team?.id || "0", 10),
                awayTeamId: parseInt(a?.team?.id || "0", 10),
                homeTeamLogo:
                  h?.team?.logos?.[0]?.href ||
                  `https://a.espncdn.com/i/teamlogos/soccer/500/${h?.team?.id}.png`,
                awayTeamLogo:
                  a?.team?.logos?.[0]?.href ||
                  `https://a.espncdn.com/i/teamlogos/soccer/500/${a?.team?.id}.png`,
                date: dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                weekday: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][dt.getDay()],
                time: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                competition: "Brasileirão",
                roundOrPhase: "Série A",
                phaseType: "league" as const,
                stadium: c?.venue?.fullName || "",
                tvChannels: ["Premiere", "Globo"],
                isFinished: false,
              };
            });
          }
        }
      } catch (err) {
        console.warn("Aviso ao carregar próximos jogos da ESPN:", err);
      }

      // 4. Libertadores Grupos via ESPN API
      let libGroups: GroupTable[] = [];
      try {
        const libRaw = await SportsDataClient.fetchEspnStandings("conmebol.libertadores");
        if (libRaw?.children && Array.isArray(libRaw.children)) {
          libGroups = libRaw.children.map((g: any) => {
            const rows = (g.standings?.entries || []).map((e: any) => ({
              position: e.stats?.find((s: any) => s.name === "rank")?.value || 0,
              teamId: parseInt(e.team?.id, 10),
              teamName: e.team?.displayName || "Time",
              teamLogo: e.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/soccer/500/${e.team?.id}.png`,
              points: e.stats?.find((s: any) => s.name === "points")?.value || 0,
              matches: e.stats?.find((s: any) => s.name === "gamesPlayed")?.value || 0,
              wins: e.stats?.find((s: any) => s.name === "wins")?.value || 0,
              draws: e.stats?.find((s: any) => s.name === "ties")?.value || 0,
              losses: e.stats?.find((s: any) => s.name === "losses")?.value || 0,
              goalDiff:
                (e.stats?.find((s: any) => s.name === "pointsFor")?.value || 0) -
                (e.stats?.find((s: any) => s.name === "pointsAgainst")?.value || 0),
              isFlamengo: parseInt(e.team?.id, 10) === clubEspnId,
            }));
            return {
              groupName: g.name || "Grupo",
              rows,
            };
          });
        }
      } catch (err) {
        console.warn("Aviso ao carregar grupos da Libertadores da ESPN:", err);
      }

      // Atualiza Campeonatos consolidados
      const flaStandingsRow = standingsRows.find((r) => r.isFlamengo);
      const flaPosNum = flaStandingsRow?.position || 2;
      const flaPtsNum = flaStandingsRow?.points || 64;

      const updatedChamps: Championship[] = DEFAULT_CHAMPIONSHIPS.map((c) => {
        if (c.id === "tourn_325") {
          return {
            ...c,
            status: `${flaPosNum}º Lugar (${flaPtsNum} pts)`,
            phase: "Série A 2026",
            standings: standingsRows.slice(0, 6),
            fullStandings: standingsRows,
          };
        }
        if (c.id === "tourn_384" && libGroups.length > 0) {
          return {
            ...c,
            groupTables: libGroups,
          };
        }
        return c;
      });

      // Aplica dados nos estados
      setNextMatch(fetchedMatch);
      setPreviousMatch(prevMatchesList[0] || DEFAULT_PREVIOUS_MATCH);
      setFollowingMatch(followMatchesList[0] || DEFAULT_FOLLOWING_MATCH);
      setPreviousMatches(prevMatchesList);
      setFollowingMatches(followMatchesList);
      setChampionships(updatedChamps);

      const now = Date.now();
      setLastUpdated(now);

      const isGameLive = fetchedMatch.isLive;
      const effectiveTtl = isGameLive ? 60 * 1000 : undefined;

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: now,
          ttl: effectiveTtl,
          match: fetchedMatch,
          previousMatch: prevMatchesList[0] || DEFAULT_PREVIOUS_MATCH,
          followingMatch: followMatchesList[0] || DEFAULT_FOLLOWING_MATCH,
          previousMatches: prevMatchesList,
          followingMatches: followMatchesList,
          championships: updatedChamps,
        }),
      );
    } catch (err) {
      console.error("Erro geral ao processar dados esportivos da ESPN:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSofascoreData();

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const now = Date.now();
      const nextDate = getNextScheduledUpdate(now);
      const delayMs = Math.max(1000, nextDate.getTime() - now);

      timerId = setTimeout(() => {
        fetchSofascoreData(true);
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const activeChamp: Championship =
    championships.find((c) => c.id === activeTab) ||
    championships[0] ||
    DEFAULT_CHAMPIONSHIPS[0]!;

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
          (r) => r.isFlamengo || r.teamId === ACTIVE_CLUB.espnId,
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
