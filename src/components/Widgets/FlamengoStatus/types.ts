export interface NextMatch {
  opponent: string;
  opponentId?: number;
  opponentLogo?: string;
  flamengoLogo?: string;
  date: string;
  weekday?: string;
  time: string;
  competition: string;
  competitionId?: number;
  roundOrPhase?: string;
  phaseType?: "league" | "group" | "knockout";
  flamengoPosition?: number;
  opponentPosition?: number;
  groupName?: string;
  isHome: boolean;
  stadium: string;
  city?: string;
  tvChannels?: string[];
  isLive?: boolean;
  homeScore?: number;
  awayScore?: number;
  statusType?: string;
  statusDescription?: string;
}

export interface KnockoutLeg {
  id?: number;
  homeTeam: string;
  homeTeamId?: number;
  awayTeam: string;
  awayTeamId?: number;
  homeScore?: number;
  awayScore?: number;
  scoreDisplay: string;
  date: string;
  status?: string;
}

export interface StandingsTeamRow {
  position: number;
  teamId?: number;
  teamName: string;
  points: number;
  matches: number;
  wins?: number;
  draws?: number;
  losses?: number;
  scoresFor?: number;
  scoresAgainst?: number;
  goalDiff?: number;
  form?: string[];
  isFlamengo: boolean;
}

export interface GroupTable {
  groupName: string;
  rows: StandingsTeamRow[];
}

export interface Championship {
  id: string;
  url?: string;
  name: string;
  status: string;
  phase: string;
  color: string;
  isLeague?: boolean;
  standings?: StandingsTeamRow[];
  fullStandings?: StandingsTeamRow[];
  groupTables?: GroupTable[];
  hasGroups?: boolean;
  hasKnockout?: boolean;
  knockout?: {
    opponent: string;
    opponentId?: number;
    phaseName: string;
    outcome?:
      | "champion"
      | "runner_up"
      | "eliminated"
      | "qualified"
      | "in_progress";
    matches: KnockoutLeg[];
  };
}

export interface ExtractedMatch {
  id?: number;
  startTimestamp: number;
  homeTeam?: {
    id?: number;
    shortName?: string;
    name?: string;
  };
  awayTeam?: {
    id?: number;
    shortName?: string;
    name?: string;
  };
  homeScore?: {
    display?: number;
    current?: number;
    penalties?: number;
  };
  awayScore?: {
    display?: number;
    current?: number;
    penalties?: number;
  };
  status?: {
    type?: string;
    description?: string;
  };
  roundInfo?: {
    name?: string;
    round?: number;
    cupRoundType?: number;
  };
  tournament?: {
    name?: string;
    uniqueTournament?: {
      id?: number;
    };
  };
  season?: {
    id?: number;
  };
}

export interface StandingsRow {
  position: number;
  team?: {
    id?: number;
    shortName?: string;
    name?: string;
  };
  points: number;
  matches: number;
  wins?: number;
  draws?: number;
  losses?: number;
  scoresFor?: number;
  scoresAgainst?: number;
  form?: unknown;
  recentForm?: unknown;
}
