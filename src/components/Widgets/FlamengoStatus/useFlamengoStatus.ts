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
  LEAGUE_DISPLAY_NAMES,
  LEAGUE_TOURNAMENT_IDS,
} from "./constants";
import {
  getInitialCachedData,
  normalizeString,
  getNextScheduledUpdate,
  hasPassedScheduledUpdate,
  detectPhaseType,
  getBroadcastChannels,
  buildTournamentKnockout,
} from "./utils";
import { SportsDataClient } from "../../../services/SportsDataClient";
import { ACTIVE_CLUB } from "./clubConfig";

const ESPN_ALL_LEAGUE = "all";
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface EspnTeamRef {
  id?: string;
  displayName?: string;
  logos?: Array<{ href?: string }>;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: { displayValue?: string; value?: number };
  team?: EspnTeamRef;
}

interface EspnEvent {
  id?: string;
  date?: string;
  league?: { slug?: string; name?: string; shortName?: string };
  seasonType?: { name?: string };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    status?: {
      type?: { completed?: boolean; state?: string; description?: string };
    };
    venue?: { fullName?: string };
  }>;
}

interface EspnStandingEntry {
  stats?: Array<{ name?: string; value?: number }>;
  team?: EspnTeamRef;
}

interface EspnStandingsResponse {
  children?: Array<{
    name?: string;
    standings?: { entries?: EspnStandingEntry[] };
  }>;
}

function getCompetitionLabel(league?: {
  slug?: string;
  name?: string;
  shortName?: string;
}): string {
  if (!league) return "Futebol";
  const known = league.slug ? LEAGUE_DISPLAY_NAMES[league.slug] : undefined;
  if (known) return known;
  return league.shortName || league.name || "Futebol";
}

function parseEventScore(competitor?: EspnCompetitor): number {
  const raw =
    competitor?.score?.displayValue ?? competitor?.score?.value ?? "0";
  return parseInt(String(raw), 10) || 0;
}

function resolvePhase(
  leagueSlug: string,
  competition: string,
  seasonTypeName: string | undefined,
  tournamentId: number | undefined,
): { phaseType: "league" | "group" | "knockout"; roundOrPhase: string } {
  if (leagueSlug === "bra.1") {
    return { phaseType: "league", roundOrPhase: "Série A" };
  }
  return detectPhaseType(
    competition,
    seasonTypeName,
    undefined,
    tournamentId,
  );
}

function buildMatchSummary(ev: EspnEvent, id: number): MatchSummary {
  const clubEspnId = ACTIVE_CLUB.espnId;
  const comp = ev.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const isHome = home?.team?.id === String(clubEspnId);
  const opp = isHome ? away : home;
  const oppId = parseInt(opp?.team?.id || "0", 10);
  const d = new Date(ev.date || 0);
  const leagueSlug = ev.league?.slug || "";
  const competition = getCompetitionLabel(ev.league);
  const tournamentId = LEAGUE_TOURNAMENT_IDS[leagueSlug];
  const { phaseType, roundOrPhase } = resolvePhase(
    leagueSlug,
    competition,
    ev.seasonType?.name,
    tournamentId,
  );
  const completed = !!comp?.status?.type?.completed;
  const state = comp?.status?.type?.state;

  return {
    id,
    opponent: opp?.team?.displayName || "Adversário",
    opponentId: oppId,
    opponentLogo:
      opp?.team?.logos?.[0]?.href ||
      `https://a.espncdn.com/i/teamlogos/soccer/500/${oppId}.png`,
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
    weekday: WEEKDAYS[d.getDay()],
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    competition,
    competitionId: tournamentId,
    roundOrPhase,
    phaseType,
    stadium: comp?.venue?.fullName || "",
    tvChannels: getBroadcastChannels(
      competition,
      isHome,
      opp?.team?.displayName || "",
    ),
    isFinished: completed,
    homeScore: completed || state === "in" ? parseEventScore(home) : undefined,
    awayScore: completed || state === "in" ? parseEventScore(away) : undefined,
    statusType: state,
    statusDescription: comp?.status?.type?.description,
  };
}

function buildNextMatch(
  ev: EspnEvent,
  standingsRows: StandingsTeamRow[],
): NextMatch {
  const clubEspnId = ACTIVE_CLUB.espnId;
  const comp = ev.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const isHome = home?.team?.id === String(clubEspnId);
  const opp = isHome ? away : home;
  const oppId = parseInt(opp?.team?.id || "0", 10);
  const d = new Date(ev.date || 0);
  const leagueSlug = ev.league?.slug || "";
  const competition = getCompetitionLabel(ev.league);
  const tournamentId = LEAGUE_TOURNAMENT_IDS[leagueSlug];
  const { phaseType, roundOrPhase } = resolvePhase(
    leagueSlug,
    competition,
    ev.seasonType?.name,
    tournamentId,
  );
  const flaRow = standingsRows.find((r) => r.isFlamengo);
  const state = comp?.status?.type?.state;

  return {
    opponent: opp?.team?.displayName || "Adversário",
    opponentId: oppId,
    opponentLogo:
      opp?.team?.logos?.[0]?.href ||
      `https://a.espncdn.com/i/teamlogos/soccer/500/${oppId}.png`,
    date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    weekday: WEEKDAYS[d.getDay()],
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    competition,
    competitionId: tournamentId,
    roundOrPhase,
    phaseType,
    flamengoPosition: flaRow?.position || 2,
    opponentPosition: standingsRows.find((r) => r.teamId === oppId)?.position,
    isHome,
    stadium: comp?.venue?.fullName || "",
    tvChannels: getBroadcastChannels(
      competition,
      isHome,
      opp?.team?.displayName || "",
    ),
    isLive: state === "in",
    homeScore:
      state === "in" || state === "post" ? parseEventScore(home) : undefined,
    awayScore:
      state === "in" || state === "post" ? parseEventScore(away) : undefined,
    statusType: state,
    statusDescription: comp?.status?.type?.description,
  };
}

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
        const standingsRaw = (await SportsDataClient.fetchEspnStandings(
          "bra.1",
        )) as EspnStandingsResponse | null;
        const rawEntries = standingsRaw?.children?.[0]?.standings?.entries || [];

        if (Array.isArray(rawEntries) && rawEntries.length > 0) {
          standingsRows = rawEntries.map((e) => {
            const pos = e.stats?.find((s) => s.name === "rank")?.value || 0;
            const pts = e.stats?.find((s) => s.name === "points")?.value || 0;
            const matches = e.stats?.find((s) => s.name === "gamesPlayed")?.value || 0;
            const wins = e.stats?.find((s) => s.name === "wins")?.value || 0;
            const draws = e.stats?.find((s) => s.name === "ties")?.value || 0;
            const losses = e.stats?.find((s) => s.name === "losses")?.value || 0;
            const scoresFor = e.stats?.find((s) => s.name === "pointsFor")?.value || 0;
            const scoresAgainst = e.stats?.find((s) => s.name === "pointsAgainst")?.value || 0;
            const goalDiff = scoresFor - scoresAgainst;
            const teamId = Number(e.team?.id);
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

      // 2. Schedule: Partidas Concluídas e Forma Recente via ESPN API (todas as competições)
      let pastEvents: EspnEvent[] = [];
      try {
        const pastRaw = await SportsDataClient.fetchEspnTeamSchedule(
          clubEspnId,
          ESPN_ALL_LEAGUE,
          false,
        );
        pastEvents = (pastRaw?.events || []).filter(
          (e: EspnEvent) => e.competitions?.[0]?.status?.type?.completed,
        );
      } catch (err) {
        console.warn("Aviso ao carregar jogos anteriores da ESPN:", err);
      }

      let prevMatchesList: MatchSummary[] = DEFAULT_PREVIOUS_MATCHES;
      if (pastEvents.length > 0) {
        pastEvents.sort(
          (a, b) =>
            new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
        );

        // Forma recente considera apenas o Campeonato Brasileiro (últimos 5 jogos)
        const braEvents = pastEvents.filter(
          (ev) => ev.league?.slug === "bra.1",
        );
        const last5 = braEvents.slice(-5);
        const flaForm = last5.map((ev) => {
          const comp = ev.competitions?.[0];
          const myComp = comp?.competitors?.find(
            (c) => c.team?.id === String(clubEspnId),
          );
          const oppComp = comp?.competitors?.find(
            (c) => c.team?.id !== String(clubEspnId),
          );
          const myScore = parseInt(
            String(myComp?.score?.displayValue ?? myComp?.score?.value ?? "0"),
            10,
          );
          const oppScore = parseInt(
            String(
              oppComp?.score?.displayValue ?? oppComp?.score?.value ?? "0",
            ),
            10,
          );
          return myScore > oppScore ? "V" : myScore < oppScore ? "D" : "E";
        });

        const myRow = standingsRows.find((r) => r.isFlamengo);
        if (myRow && flaForm.length > 0) {
          myRow.form = flaForm;
        }

        // Monta lista dos 3 jogos anteriores mais recentes (todas as competições)
        prevMatchesList = pastEvents
          .slice(-3)
          .reverse()
          .map((ev, idx: number) => buildMatchSummary(ev, idx + 1));
      }

      // 3. Fixtures: Próximo Jogo e Jogos Seguintes via ESPN API (todas as competições)
      let futureEvents: EspnEvent[] = [];
      try {
        const futureRaw = await SportsDataClient.fetchEspnTeamSchedule(
          clubEspnId,
          ESPN_ALL_LEAGUE,
          true,
        );
        futureEvents = futureRaw?.events || [];
      } catch (err) {
        console.warn("Aviso ao carregar próximos jogos da ESPN:", err);
      }

      let fetchedMatch: NextMatch = DEFAULT_MOCK_MATCH;
      let followMatchesList: MatchSummary[] = DEFAULT_FOLLOWING_MATCHES;
      if (futureEvents.length > 0) {
        futureEvents.sort(
          (a, b) =>
            new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
        );

        fetchedMatch = buildNextMatch(futureEvents[0]!, standingsRows);

        const upcomingSlice = futureEvents.slice(1, 4);
        if (upcomingSlice.length > 0) {
          followMatchesList = upcomingSlice.map((ev, idx: number) =>
            buildMatchSummary(ev, idx + 10),
          );
        }
      }

      // 4. Libertadores Grupos via ESPN API
      let libGroups: GroupTable[] = [];
      try {
        const libRaw = (await SportsDataClient.fetchEspnStandings(
          "conmebol.libertadores",
        )) as EspnStandingsResponse | null;
        if (libRaw?.children && Array.isArray(libRaw.children)) {
          libGroups = libRaw.children.map((g) => {
            const rows = (g.standings?.entries || []).map((e) => ({
              position: e.stats?.find((s) => s.name === "rank")?.value || 0,
              teamId: Number(e.team?.id),
              teamName: e.team?.displayName || "Time",
              teamLogo: e.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/soccer/500/${e.team?.id}.png`,
              points: e.stats?.find((s) => s.name === "points")?.value || 0,
              matches: e.stats?.find((s) => s.name === "gamesPlayed")?.value || 0,
              wins: e.stats?.find((s) => s.name === "wins")?.value || 0,
              draws: e.stats?.find((s) => s.name === "ties")?.value || 0,
              losses: e.stats?.find((s) => s.name === "losses")?.value || 0,
              goalDiff:
                (e.stats?.find((s) => s.name === "pointsFor")?.value || 0) -
                (e.stats?.find((s) => s.name === "pointsAgainst")?.value || 0),
              isFlamengo: Number(e.team?.id) === clubEspnId,
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

      // Combina jogos passados e futuros (sem duplicatas) para montar o mata-mata
      const allEvents = [...pastEvents, ...futureEvents].filter(
        (ev, idx: number, arr: EspnEvent[]) =>
          arr.findIndex((x) => x.id === ev.id) === idx,
      );
      const eventsForLeague = (slug: string) =>
        allEvents.filter((ev) => ev.league?.slug === slug);

      const libKnockout = buildTournamentKnockout(
        eventsForLeague("conmebol.libertadores"),
        clubEspnId,
      );
      const cdbKnockout = buildTournamentKnockout(
        eventsForLeague("bra.copa_do_brazil"),
        clubEspnId,
      );

      const knockoutStatus = (
        k: NonNullable<ReturnType<typeof buildTournamentKnockout>>,
      ): string => {
        switch (k.outcome) {
          case "champion":
            return "Campeão!";
          case "runner_up":
            return "Vice-Campeão";
          case "qualified":
            return `Classificado (${k.phaseName})`;
          case "eliminated":
            return `Eliminado (${k.phaseName})`;
          default:
            return k.phaseName;
        }
      };

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
        if (c.id === "tourn_384") {
          const updated: Championship = { ...c };
          if (libGroups.length > 0) updated.groupTables = libGroups;
          if (libKnockout) {
            updated.status = knockoutStatus(libKnockout);
            updated.phase = `${libKnockout.phaseName} • Libertadores 2026`;
            updated.knockout = {
              opponent: libKnockout.opponent,
              opponentId: libKnockout.opponentId,
              phaseName: libKnockout.phaseName,
              outcome: libKnockout.outcome,
              matches: libKnockout.matches,
            };
          }
          return updated;
        }
        if (c.id === "tourn_373") {
          const updated: Championship = { ...c };
          if (cdbKnockout) {
            updated.status = knockoutStatus(cdbKnockout);
            updated.phase = `${cdbKnockout.phaseName} • Copa do Brasil 2026`;
            updated.knockout = {
              opponent: cdbKnockout.opponent,
              opponentId: cdbKnockout.opponentId,
              phaseName: cdbKnockout.phaseName,
              outcome: cdbKnockout.outcome,
              matches: cdbKnockout.matches,
            };
          }
          return updated;
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
