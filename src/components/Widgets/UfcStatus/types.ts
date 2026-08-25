export interface Fighter {
  id?: string;
  name: string;
  shortName?: string;
  country: string;
  countryCode?: string;
  flagUrl?: string;
  record?: string;
  ranking?: string | number; // e.g. '#2', 'C', 2
  headshot?: string;
  winner?: boolean;
}

export interface FightMatch {
  id: string;
  category: string;
  categoryPt: string;
  weightLimit?: string;
  isMainEvent?: boolean;
  isCoMainEvent?: boolean;
  rounds?: number;
  fighter1: Fighter;
  fighter2: Fighter;
  cardSegment?: string; // "Card Principal" | "Preliminares"
  status?: string;
}

export interface UfcEvent {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  dateStr: string;
  weekdayStr: string;
  timeStr: string;
  isoDate: string;
  venueName?: string;
  city?: string;
  country?: string;
  broadcast?: string;
  isLive?: boolean;
  statusDescription?: string;
  mainEvent?: FightMatch;
  coMainEvent?: FightMatch;
  allFights: FightMatch[];
}

export interface UfcCacheData {
  timestamp: number;
  events: UfcEvent[];
}
