import type { UfcEvent, FightMatch, Fighter } from "./types";
import {
  WEIGHT_CLASSES_MAP,
  COUNTRY_TRANSLATIONS,
  DEFAULT_MOCK_EVENT,
  CACHE_KEY,
} from "./constants";

export function translateCategory(catRaw?: string): { namePt: string; limit: string } {
  if (!catRaw) return { namePt: "MMA", limit: "" };
  const key = catRaw.trim().toLowerCase();
  
  if (WEIGHT_CLASSES_MAP[key]) {
    return WEIGHT_CLASSES_MAP[key];
  }

  // Partial matches
  for (const [k, v] of Object.entries(WEIGHT_CLASSES_MAP)) {
    if (key.includes(k)) {
      return v;
    }
  }

  return { namePt: catRaw, limit: "" };
}

export function translateCountry(countryRaw?: string): string {
  if (!countryRaw) return "Não informado";
  const key = countryRaw.trim().toLowerCase();
  return COUNTRY_TRANSLATIONS[key] || countryRaw;
}

export function formatUfcDateTime(dateInput: string | number): {
  dateStr: string;
  weekdayStr: string;
  timeStr: string;
} {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return { dateStr: "--/--", weekdayStr: "", timeStr: "--:--" };
    }

    const dateStr = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const rawWeekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
    const weekdayStr = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);

    const timeStr = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { dateStr, weekdayStr, timeStr };
  } catch {
    return { dateStr: "--/--", weekdayStr: "", timeStr: "--:--" };
  }
}

export function getFighterHeadshot(id?: string): string | undefined {
  if (!id) return undefined;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${id}.png&w=350&h=254`;
}

interface RankingMapEntry {
  rank: string | number;
  division: string;
}

export function buildRankingsMap(rankingsData: unknown): Map<string, RankingMapEntry> {
  const map = new Map<string, RankingMapEntry>();
  const data = rankingsData as { rankings?: Array<{ type?: string; weightClass?: { text?: string }; name?: string; ranks?: Array<{ current?: number; athlete?: { id?: string; displayName?: string; fullName?: string } }> }> };
  if (!data?.rankings || !Array.isArray(data.rankings)) return map;

  for (const cat of data.rankings) {
    const divName = cat.weightClass?.text || cat.name || "";
    for (const r of cat.ranks || []) {
      const isChamp = r.current === 1 && (cat.type?.includes("champion") || cat.name?.toLowerCase().includes("champion"));
      const rankValue = isChamp ? "C" : `#${r.current}`;
      const name = r.athlete?.displayName || r.athlete?.fullName;
      const id = r.athlete?.id;

      if (name) {
        map.set(name.toLowerCase().trim(), { rank: rankValue, division: divName });
      }
      if (id) {
        map.set(String(id), { rank: rankValue, division: divName });
      }
    }
  }

  return map;
}

interface RawCompetitor {
  id?: string;
  athlete?: {
    id?: string;
    fullName?: string;
    displayName?: string;
    shortName?: string;
    flag?: {
      href?: string;
      alt?: string;
    };
  };
  records?: Array<{ summary?: string }>;
  winner?: boolean;
}

interface RawCompetition {
  id?: string;
  type?: {
    abbreviation?: string;
    text?: string;
  };
  cardSegment?: {
    description?: string;
  };
  competitors?: RawCompetitor[];
  status?: {
    type?: {
      description?: string;
    };
  };
}

interface RawUfcEvent {
  id: string;
  name: string;
  shortName?: string;
  date: string;
  competitions?: RawCompetition[];
}

export function parseUfcRankingsHtml(html: string): Map<string, string> {
  const rankMap = new Map<string, string>();
  if (!html) return rankMap;

  // 1. Linhas de ranking na tabela do UFC:
  const rowRegex =
    /<tr[^>]*>[\s\S]*?views-field-weight-class-rank[^>]*>\s*(\d+)\s*<\/td>[\s\S]*?views-field-title[^>]*>\s*<a[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = rowRegex.exec(html)) !== null) {
    const rank = m[1]?.trim();
    const name = m[2]?.trim();
    if (rank && name) {
      const cleanName = name.replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
      const rankVal = `#${rank}`;
      const lower = cleanName.toLowerCase();
      const norm = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      rankMap.set(lower, rankVal);
      rankMap.set(norm, rankVal);

      const parts = norm.split(" ");
      if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
        rankMap.set(`${parts[parts.length - 1]} ${parts[0]}`, rankVal);
        rankMap.set(`${parts[0]} ${parts[parts.length - 1]}`, rankVal);
      }
      const lastName = parts[parts.length - 1];
      if (lastName) {
        rankMap.set(lastName, rankVal);
      }
    }
  }

  // 2. Campeões de cada divisão:
  const champRegex =
    /<div class="views-field views-field-title">\s*<a[^>]*>([^<]+)<\/a>[\s\S]*?(?:Campeão|Champion)/gi;
  let c;
  while ((c = champRegex.exec(html)) !== null) {
    const name = c[1]?.trim();
    if (name) {
      const cleanName = name.replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
      const lower = cleanName.toLowerCase();
      const norm = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      rankMap.set(lower, "C");
      rankMap.set(norm, "C");
      const parts = norm.split(" ");
      const lastName = parts[parts.length - 1];
      if (lastName) {
        rankMap.set(lastName, "C");
      }
    }
  }

  return rankMap;
}

export function parseUfcSitePhotos(html: string): Map<string, string> {
  const photoMap = new Map<string, string>();
  if (!html) return photoMap;

  // 1. Extrair de blocos fight-card-tickets: data-fight-label="Nurmagomedov vs Song"
  const fightCardRegex =
    /<div class="fight-card-tickets"[^>]*data-fight-label="([^"]*)"[\s\S]*?<\/article>\s*<\/div>/g;
  let match;
  while ((match = fightCardRegex.exec(html)) !== null) {
    const fightLabel = match[1];
    const block = match[0];
    const imgMatches = [...block.matchAll(/<img[^>]+src="([^">]+)"/g)].map(
      (m) => m[1]
    );
    const redImg = imgMatches[0];
    const blueImg = imgMatches[1];

    if (fightLabel && fightLabel.includes(" vs ")) {
      const [p1, p2] = fightLabel.split(" vs ").map((s) => s.trim().toLowerCase());
      if (p1 && redImg) photoMap.set(p1, redImg);
      if (p2 && blueImg) photoMap.set(p2, blueImg);
    }
  }

  // 2. Extrair pelo nome do arquivo (ex: NURMAGOMEDOV_UMAR_01-24.png)
  const allImages = [
    ...html.matchAll(/src="((?:https:\/\/ufc\.com|\/sites|\/images)\/[^"]+\.(?:png|jpg|jpeg)[^"]*)"/g),
  ].map((m) => m[1]);

  for (let imgUrl of allImages) {
    if (!imgUrl) continue;
    if (imgUrl.startsWith("/")) {
      imgUrl = `https://ufc.com${imgUrl}`;
    }
    const filenameMatch = imgUrl.match(/\/([A-Z0-9_-]+)\.(?:png|jpg|jpeg)/i);
    if (filenameMatch && filenameMatch[1]) {
      const cleanName = filenameMatch[1]
        .replace(/_\d{2}-\d{2}$/, "")
        .replace(/_BELTMOCK$/, "")
        .replace(/_BELT$/, "")
        .replace(/_CG$/, "")
        .replace(/_/g, " ")
        .toLowerCase()
        .trim();

      photoMap.set(cleanName, imgUrl);
      const parts = cleanName.split(" ");
      if (parts[0]) {
        photoMap.set(parts[0], imgUrl); // sobrenome ou primeiro nome
        if (parts[1]) {
          photoMap.set(`${parts[1]} ${parts[0]}`, imgUrl); // invertido
        }
      }
    }
  }

  return photoMap;
}

export function resolveFighterPhoto(
  name: string,
  id?: string,
  ufcPhotoMap?: Map<string, string>
): string | undefined {
  if (ufcPhotoMap && ufcPhotoMap.size > 0) {
    const key = name.toLowerCase().trim();
    const norm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts = key.split(" ");
    const lastName = parts[parts.length - 1] || "";
    const firstName = parts[0] || "";

    const ufcImg =
      ufcPhotoMap.get(key) ||
      ufcPhotoMap.get(norm) ||
      (lastName ? ufcPhotoMap.get(lastName) : undefined) ||
      (firstName ? ufcPhotoMap.get(firstName) : undefined);

    if (ufcImg) return ufcImg;
  }
  return getFighterHeadshot(id);
}

export function parseUfcEvents(
  scoreboardData: { events?: RawUfcEvent[] },
  rankingsData: unknown,
  ufcPhotoMap?: Map<string, string>,
  ufcRankMap?: Map<string, string>
): UfcEvent[] {
  if (!scoreboardData?.events || !Array.isArray(scoreboardData.events)) {
    return [DEFAULT_MOCK_EVENT];
  }

  const espnRankMap = buildRankingsMap(rankingsData);

  const getRank = (name: string, id?: string): string | number | undefined => {
    const key = name.toLowerCase().trim();
    const norm = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts = norm.split(" ");
    const lastName = parts[parts.length - 1] || "";
    const inverted = parts.length === 2 && parts[0] && parts[1] ? `${parts[1]} ${parts[0]}` : "";

    if (ufcRankMap) {
      const ufcR =
        ufcRankMap.get(key) ||
        ufcRankMap.get(norm) ||
        (inverted ? ufcRankMap.get(inverted) : undefined) ||
        (lastName ? ufcRankMap.get(lastName) : undefined);
      if (ufcR) return ufcR;
    }
    return (
      espnRankMap.get(key)?.rank ||
      espnRankMap.get(norm)?.rank ||
      (inverted ? espnRankMap.get(inverted)?.rank : undefined) ||
      (lastName ? espnRankMap.get(lastName)?.rank : undefined) ||
      (id ? espnRankMap.get(String(id))?.rank : undefined)
    );
  };

  // Filter out Contender Series if desired or prioritize UFC Fight Nights and Numbered UFC cards
  const ufcEvents = scoreboardData.events.filter((e) => {
    const nameLower = e.name?.toLowerCase() || "";
    return nameLower.includes("ufc");
  });

  const targetEvents = ufcEvents.length > 0 ? ufcEvents : scoreboardData.events;

  const parsedEvents: UfcEvent[] = targetEvents.map((ev) => {
    const { dateStr, weekdayStr, timeStr } = formatUfcDateTime(ev.date);
    const firstComp = ev.competitions?.[0] as unknown as { venue?: { fullName?: string; address?: { city?: string; country?: string } } } | undefined;
    const venue = firstComp?.venue;

    const rawComps: RawCompetition[] = ev.competitions || [];
    // In ESPN scoreboard, competitions are ordered from opening fight to main event.
    // So reversing them makes main event first!
    const compsReversed = [...rawComps].reverse();

    const allFights: FightMatch[] = compsReversed.map((comp, idx) => {
      const f1Raw = comp.competitors?.[0];
      const f2Raw = comp.competitors?.[1];

      const f1Name = f1Raw?.athlete?.displayName || f1Raw?.athlete?.fullName || "Lutador 1";
      const f2Name = f2Raw?.athlete?.displayName || f2Raw?.athlete?.fullName || "Lutador 2";

      const f1Id = f1Raw?.id || f1Raw?.athlete?.id;
      const f2Id = f2Raw?.id || f2Raw?.athlete?.id;

      const f1Rank = getRank(f1Name, f1Id);
      const f2Rank = getRank(f2Name, f2Id);

      const catRaw = comp.type?.abbreviation || comp.type?.text || "MMA";
      const { namePt, limit } = translateCategory(catRaw);

      const isMainEvent = idx === 0;
      const isCoMainEvent = idx === 1;

      const fighter1: Fighter = {
        id: f1Id,
        name: f1Name,
        shortName: f1Raw?.athlete?.shortName,
        country: translateCountry(f1Raw?.athlete?.flag?.alt),
        flagUrl: f1Raw?.athlete?.flag?.href,
        record: f1Raw?.records?.[0]?.summary,
        ranking: f1Rank,
        headshot: resolveFighterPhoto(f1Name, f1Id, ufcPhotoMap),
        winner: f1Raw?.winner,
      };

      const fighter2: Fighter = {
        id: f2Id,
        name: f2Name,
        shortName: f2Raw?.athlete?.shortName,
        country: translateCountry(f2Raw?.athlete?.flag?.alt),
        flagUrl: f2Raw?.athlete?.flag?.href,
        record: f2Raw?.records?.[0]?.summary,
        ranking: f2Rank,
        headshot: resolveFighterPhoto(f2Name, f2Id, ufcPhotoMap),
        winner: f2Raw?.winner,
      };

      return {
        id: comp.id || `fight-${idx}`,
        category: catRaw,
        categoryPt: namePt,
        weightLimit: limit,
        isMainEvent,
        isCoMainEvent,
        rounds: isMainEvent ? 5 : 3,
        fighter1,
        fighter2,
        cardSegment: comp.cardSegment?.description || (idx < 5 ? "Card Principal" : "Preliminares"),
        status: comp.status?.type?.description,
      };
    });

    const mainEvent = allFights[0];
    const coMainEvent = allFights[1];

    // Build friendly title and subtitle
    let title = ev.name;
    let subtitle = "";
    if (ev.name.includes(":")) {
      const parts = ev.name.split(":");
      title = parts[0]?.trim() || ev.name;
      subtitle = parts.slice(1).join(":").trim();
    } else if (mainEvent) {
      subtitle = `${mainEvent.fighter1.name} vs ${mainEvent.fighter2.name}`;
    }

    return {
      id: ev.id,
      name: ev.name,
      title,
      subtitle: subtitle || undefined,
      dateStr,
      weekdayStr,
      timeStr,
      isoDate: ev.date,
      venueName: venue?.fullName || "Arena a definir",
      city: venue?.address?.city || undefined,
      country: translateCountry(venue?.address?.country),
      broadcast: "Paramount+ / UFC Fight Pass",
      isLive: false,
      mainEvent,
      coMainEvent,
      allFights,
    };
  });

  return parsedEvents.length > 0 ? parsedEvents : [DEFAULT_MOCK_EVENT];
}

export function isEventPassed(isoDate?: string): boolean {
  if (!isoDate) return false;
  try {
    const eventTime = new Date(isoDate).getTime();
    if (isNaN(eventTime)) return false;
    // Um evento é considerado encerrado 10 horas após o início do card
    return eventTime + 10 * 60 * 60 * 1000 < Date.now();
  } catch {
    return false;
  }
}

export function getInitialCachedUfcData(): { events: UfcEvent[]; timestamp: number | null } {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.events && Array.isArray(parsed.events) && parsed.events.length > 0) {
        const upcoming = parsed.events.filter((e: UfcEvent) => !isEventPassed(e.isoDate));
        if (upcoming.length > 0) {
          return { events: upcoming, timestamp: parsed.timestamp || null };
        }
      }
    }
  } catch (e) {
    console.error("Erro ao ler cache do UFC:", e);
  }

  return { events: [DEFAULT_MOCK_EVENT], timestamp: null };
}
