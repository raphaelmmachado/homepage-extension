import type { NextMatch, Championship, ExtractedMatch } from "./types";
import { DEFAULT_MOCK_MATCH, DEFAULT_CHAMPIONSHIPS, CACHE_KEY, CACHE_TTL, KNOWN_STADIUMS, SOFASCORE_TEAM_ID, LFU_TEAMS } from "./constants";


export function extractMatchesRecursively(data: unknown): ExtractedMatch[] {
  const list: ExtractedMatch[] = [];
  const seenIds = new Set<string>();

  function traverse(node: unknown) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
      return;
    }

    const obj = node as Record<string, unknown>;
    const homeTeam = obj.homeTeam as ExtractedMatch["homeTeam"];
    const awayTeam = obj.awayTeam as ExtractedMatch["awayTeam"];
    const startTimestamp = obj.startTimestamp as number | undefined;
    const id = obj.id as number | string | undefined;

    if (homeTeam?.id && awayTeam?.id && (startTimestamp || id)) {
      const matchId = `${id || ""}-${startTimestamp || ""}-${homeTeam.id}-${awayTeam.id}`;
      if (!seenIds.has(matchId)) {
        seenIds.add(matchId);
        list.push(obj as unknown as ExtractedMatch);
      }
    }

    if (obj.event && typeof obj.event === "object") {
      traverse(obj.event);
    }

    if (Array.isArray(obj.events)) {
      for (const ev of obj.events) {
        traverse(ev);
      }
    }

    for (const key of Object.keys(obj)) {
      if (
        key !== "manager" &&
        key !== "players" &&
        key !== "substitutions" &&
        key !== "treeViews"
      ) {
        traverse(obj[key]);
      }
    }
  }

  traverse(data);
  return list;
}

export function isKnockoutRoundName(rawName?: string, tournamentId?: number): boolean {
  if (!rawName) return false;
  const lower = rawName.toLowerCase().trim();

  // Exclui categoricamente fases de grupos, rodadas regulares e classificatórias
  if (
    lower.includes("group") ||
    lower.includes("grupo") ||
    lower.includes("regular") ||
    lower.includes("qualif") ||
    /^round\s*\d+$/i.test(lower) ||
    /^rodada\s*\d+$/i.test(lower)
  ) {
    return false;
  }

  // Identifica fases eliminatórias de mata-mata legítimas
  if (
    lower.includes("oitavas") ||
    lower.includes("round of 16") ||
    lower.includes("16 avos") ||
    lower.includes("16-avos") ||
    lower.includes("quartas") ||
    lower.includes("quarter") ||
    lower.includes("semi") ||
    lower.includes("final") ||
    lower.includes("playoff")
  ) {
    return true;
  }

  // Na Copa do Brasil (373), a 3ª Fase é eliminatória direta
  if (
    tournamentId === 373 &&
    (lower.includes("3ª fase") || lower.includes("3rd round"))
  ) {
    return true;
  }

  return false;
}

export function translatePhaseName(name?: string): string {
  if (!name) return "Fase Eliminatória";
  const lower = name.toLowerCase().trim();

  // Final
  if (
    lower === "final" ||
    lower === "finals" ||
    lower.includes("grande final")
  ) {
    return "Grande Final";
  }

  // Semifinal
  if (lower.includes("semi")) return "Semifinais";

  // Quartas
  if (lower.includes("quarter") || lower.includes("quartas"))
    return "Quartas de Final";

  // Oitavas
  if (
    lower.includes("round of 16") ||
    lower.includes("oitavas") ||
    lower.includes("16 avos") ||
    lower.includes("16-avos")
  ) {
    return "Oitavas de Final";
  }

  // 3ª Fase (Preliminar de Copa)
  if (
    lower.includes("3ª fase") ||
    lower.includes("3rd round") ||
    lower.includes("round of 32") ||
    lower.includes("32 avos")
  ) {
    return "3ª Fase (Preliminar)";
  }

  if (
    lower.includes("group") ||
    lower.includes("grupo") ||
    /^round\s*\d+$/i.test(lower) ||
    /^rodada\s*\d+$/i.test(lower)
  ) {
    return "Fase de Grupos";
  }

  if (
    lower.includes("prelimin") ||
    lower.includes("qualif")
  ) {
    return "Fase Preliminar";
  }

  return name;
}

export function detectPhaseType(
  competitionName: string = "",
  roundName?: string,
  roundNumber?: number,
  tournamentId?: number,
): {
  phaseType: "league" | "group" | "knockout";
  roundOrPhase: string;
} {
  const comp = competitionName.toLowerCase();
  const round = (roundName || "").toLowerCase();

  // 1. Torneio de Liga / Pontos Corridos (ex: Brasileirão Série A)
  const isKnownLeague =
    tournamentId === 325 ||
    comp.includes("brasileir") ||
    comp.includes("série a") ||
    comp.includes("serie a") ||
    comp.includes("premier league") ||
    comp.includes("la liga");

  if (isKnownLeague) {
    const roundStr = roundNumber
      ? `${roundNumber}ª Rodada`
      : roundName
        ? translatePhaseName(roundName)
        : "";
    return {
      phaseType: "league",
      roundOrPhase: roundStr,
    };
  }

  // 2. Fase de Grupos (em torneios com grupos e mata-mata)
  if (
    round.includes("group") ||
    round.includes("grupo") ||
    round.includes("fase de grupo")
  ) {
    return {
      phaseType: "group",
      roundOrPhase: translatePhaseName(roundName || "Fase de Grupos"),
    };
  }

  // 3. Mata-mata / Fase Eliminatória (Copa do Brasil, Libertadores em mata-mata, etc.)
  return {
    phaseType: "knockout",
    roundOrPhase: translatePhaseName(roundName || "Fase Eliminatória"),
  };
}

export function parseForm(rawForm: unknown): string[] {
  if (!rawForm) return [];
  let items: string[] = [];
  if (typeof rawForm === "string") {
    if (rawForm.includes(",")) {
      items = rawForm.split(",");
    } else {
      items = rawForm.split("");
    }
  } else if (Array.isArray(rawForm)) {
    items = rawForm.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        return String(
          obj.value ||
          obj.result ||
          obj.outcome ||
          obj.type ||
          obj.status ||
          obj.form ||
          obj.res ||
          ""
        );
      }
      return "";
    });
  }

  return items
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
    .map((c) => {
      if (c === "W" || c === "V" || c === "WIN" || c === "VITÓRIA" || c === "VITORIA") return "V";
      if (c === "D" || c === "E" || c === "DRAW" || c === "EMPATE") return "E";
      if (c === "L" || c === "LOSS" || c === "DERROTA") return "D";
      return c.charAt(0);
    })
    .slice(-5);
}

export function formatMatchDateTime(startTimestamp: number): {
  dateStr: string;
  weekdayStr: string;
  timeStr: string;
} {
  const dateObj = new Date(startTimestamp * 1000);
  if (isNaN(dateObj.getTime())) {
    return {
      dateStr: "A definir",
      weekdayStr: "",
      timeStr: "--:--",
    };
  }

  const dateStr = dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const rawWeekday = dateObj.toLocaleDateString("pt-BR", { weekday: "short" });
  const weekdayStr = rawWeekday
    ? rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1).replace(".", "")
    : "";

  const timeStr = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { dateStr, weekdayStr, timeStr };
}

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getKnownStadium(teamName: string): string {
  const norm = normalizeString(teamName);
  for (const [key, stadium] of Object.entries(KNOWN_STADIUMS)) {
    const normKey = normalizeString(key);
    if (norm.includes(normKey)) {
      return stadium;
    }
  }
  return "";
}

export function resolveStadiumDisplay(match: NextMatch): {
  venueType: string;
  stadiumName: string;
} {
  const venueType = match.isHome ? "Em Casa" : "Fora de Casa";

  let stadiumName = "";

  // Se match.stadium já tem um nome válido de estádio e não é texto genérico
  if (
    match.stadium &&
    match.stadium !== "Fora de Casa" &&
    match.stadium !== "Buscando..." &&
    match.stadium !== "Carregando..." &&
    match.stadium !== "Estádio a definir" &&
    !match.stadium.toLowerCase().includes("mando flamengo") &&
    !match.stadium.toLowerCase().includes("fora de casa")
  ) {
    stadiumName = match.stadium;
  }

  // Se for mandante, o estádio principal é o Maracanã
  if (!stadiumName && match.isHome) {
    stadiumName = "Maracanã";
  }

  // Se for visitante, busca pelo nome do adversário
  if (
    !stadiumName &&
    match.opponent &&
    match.opponent !== "Carregando..." &&
    match.opponent !== "Adversário"
  ) {
    stadiumName = getKnownStadium(match.opponent);
  }

  // Se tiver cidade identificada
  if (!stadiumName && match.city) {
    stadiumName = `Estádio em ${match.city}`;
  }

  return {
    venueType,
    stadiumName: stadiumName || (match.isHome ? "Maracanã" : ""),
  };
}

export function getBroadcastChannels(
  competitionName?: string,
  isHome: boolean = true,
  opponentName: string = "",
  rawTvChannels: string[] = [],
): string[] {
  if (rawTvChannels && rawTvChannels.length > 0) {
    return rawTvChannels;
  }

  if (!competitionName) return [];

  const comp = competitionName.toLowerCase();
  const opp = opponentName.toLowerCase();

  // 1. Campeonato Brasileiro (Lei do Mandante - LIBRA vs LFU)
  if (
    comp.includes("brasileir") ||
    comp.includes("série a") ||
    comp.includes("serie a")
  ) {
    // Mando do Flamengo (LIBRA): 100% Grupo Globo
    if (isHome) {
      return ["Premiere", "SporTV", "TV Globo", "Globoplay / GE TV"];
    }

    // Flamengo Visitante contra o Cruzeiro (exclusividade no Prime Video)
    if (opp.includes("cruzeiro")) {
      return ["Prime Video (Exclusivo)"];
    }

    // Outros mandantes da LFU: Prime Video (jogos exclusivos de 1ª escolha) ou CazéTV / Record / Premiere
    const isLfuOpponent = LFU_TEAMS.some((t) => opp.includes(t));
    if (isLfuOpponent) {
      return ["Prime Video", "CazéTV (YouTube)", "Record", "Premiere"];
    }

    // Mandante da LIBRA (Palmeiras, São Paulo, Grêmio, Atlético-MG, Bahia, Bragantino, Vitória, etc.)
    return ["Premiere", "SporTV", "TV Globo", "Globoplay"];
  }

  // 2. Copa Libertadores (TV Globo, ESPN / Disney+ ou Paramount+)
  if (comp.includes("libertadores")) {
    return ["ESPN / Disney+", "Paramount+", "TV Globo"];
  }

  // 3. Copa do Brasil (Grupo Globo e Amazon Prime Video)
  if (comp.includes("copa do brasil")) {
    return ["Prime Video", "SporTV / Premiere", "TV Globo"];
  }

  // 4. Mundial de Clubes / Intercontinental FIFA
  if (
    comp.includes("mundial") ||
    comp.includes("intercontinental") ||
    comp.includes("fifa")
  ) {
    return ["TV Globo", "CazéTV (YouTube)", "SporTV"];
  }

  // 5. Supercopa / Recopa
  if (comp.includes("supercopa") || comp.includes("recopa")) {
    return ["TV Globo", "SporTV", "ESPN"];
  }

  // 6. Campeonato Carioca
  if (comp.includes("carioca")) {
    return ["Band", "CazéTV", "Premiere", "Canal GOAT"];
  }

  return ["Premiere", "SporTV", "TV Globo"];
}

/**
 * Avalia se o time foi Campeão, Vice, Eliminado ou Classificado em um mata-mata
 */
export function evaluateKnockoutStatus(
  legs: ExtractedMatch[],
  phaseName: string,
): {
  outcome:
    | "champion"
    | "runner_up"
    | "eliminated"
    | "qualified"
    | "in_progress";
  label: string;
  badgeColor: string;
} {
  if (legs.length === 0) {
    return {
      outcome: "in_progress",
      label: "Em Disputa",
      badgeColor: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-medium",
    };
  }

  const allFinished = legs.every(
    (m) => m.status?.type === "finished" || m.status?.type === "ended",
  );
  const hasUpcoming = legs.some((m) => m.status?.type === "notstarted");

  const isFinal =
    phaseName.toLowerCase().includes("final") &&
    !phaseName.toLowerCase().includes("semi") &&
    !phaseName.toLowerCase().includes("quartas") &&
    !phaseName.toLowerCase().includes("oitavas");

  // Se ainda há jogo a ser disputado nessa fase (ex: 2º jogo da volta)
  if (hasUpcoming || !allFinished) {
    return {
      outcome: "in_progress",
      label: isFinal ? "Final em Disputa" : "Em Andamento",
      badgeColor: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-medium",
    };
  }

  // Se todos os jogos da fase acabaram, calcula o placar agregado e pênaltis
  let flaGoals = 0;
  let oppGoals = 0;
  let flaPenalties = 0;
  let oppPenalties = 0;
  let hasPenalties = false;

  for (const m of legs) {
    const isHome = m.homeTeam?.id === SOFASCORE_TEAM_ID;
    const hScore = m.homeScore?.display ?? m.homeScore?.current ?? 0;
    const aScore = m.awayScore?.display ?? m.awayScore?.current ?? 0;

    if (isHome) {
      flaGoals += hScore;
      oppGoals += aScore;
      if (
        m.homeScore?.penalties !== undefined &&
        m.awayScore?.penalties !== undefined
      ) {
        hasPenalties = true;
        flaPenalties = m.homeScore.penalties;
        oppPenalties = m.awayScore.penalties;
      }
    } else {
      flaGoals += aScore;
      oppGoals += hScore;
      if (
        m.awayScore?.penalties !== undefined &&
        m.homeScore?.penalties !== undefined
      ) {
        hasPenalties = true;
        flaPenalties = m.awayScore.penalties;
        oppPenalties = m.homeScore.penalties;
      }
    }
  }

  let flaWon = false;
  if (flaGoals > oppGoals) {
    flaWon = true;
  } else if (flaGoals === oppGoals) {
    if (hasPenalties) {
      flaWon = flaPenalties > oppPenalties;
    } else {
      if (legs.length === 1 && !isFinal) {
        return {
          outcome: "in_progress",
          label: "1º jogo realizado",
          badgeColor: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-medium",
        };
      }
    }
  }

  if (flaWon) {
    if (isFinal) {
      return {
        outcome: "champion",
        label: "Campeão!",
        badgeColor: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold",
      };
    } else {
      return {
        outcome: "qualified",
        label: "Classificado para próxima fase",
        badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium",
      };
    }
  } else {
    if (isFinal) {
      return {
        outcome: "runner_up",
        label: "Vice-Campeão",
        badgeColor: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium",
      };
    } else {
      return {
        outcome: "eliminated",
        label: "Eliminado",
        badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-medium",
      };
    }
  }
}

export function getInitialCachedData(): {
  match: NextMatch;
  championships: Championship[];
  isStale: boolean;
  timestamp: number | null;
} {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const ttl = parsed.ttl || CACHE_TTL;
      const isStale = Date.now() - (parsed.timestamp || 0) >= ttl;
      
      const cachedChamps: Championship[] = Array.isArray(parsed.championships)
        ? parsed.championships
        : [];

      const mergedChampionships = DEFAULT_CHAMPIONSHIPS.map((defChamp) => {
        const found = cachedChamps.find((c) => c.id === defChamp.id);
        if (!found) return defChamp;
        return {
          ...defChamp,
          ...found,
          fullStandings:
            found.fullStandings && found.fullStandings.length > 0
              ? found.fullStandings
              : defChamp.fullStandings,
          groupTables:
            found.groupTables && found.groupTables.length > 0
              ? found.groupTables
              : defChamp.groupTables,
        };
      });

      return {
        match: parsed.match || DEFAULT_MOCK_MATCH,
        championships: mergedChampionships,
        isStale,
        timestamp: parsed.timestamp || null,
      };
    }
  } catch (e) {
    console.error("Erro ao ler cache inicial:", e);
  }
  return {
    match: DEFAULT_MOCK_MATCH,
    championships: DEFAULT_CHAMPIONSHIPS,
    isStale: true,
    timestamp: null,
  };
}
