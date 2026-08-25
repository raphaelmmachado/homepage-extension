import type { NextMatch, Championship } from "./types";
import { ACTIVE_CLUB } from "./clubConfig";

export { ACTIVE_CLUB };

export const DEFAULT_MOCK_MATCH: NextMatch = {
  opponent: "Carregando...",
  date: "--/--/----",
  weekday: "",
  time: "--:--",
  competition: "Buscando...",
  isHome: true,
  stadium: "Buscando...",
};

export const SOFASCORE_TEAM_ID = ACTIVE_CLUB.id;
export const FLAMENGO_LOGO_URL = ACTIVE_CLUB.badgeUrl;
export const CACHE_KEY = `my-homepage-${ACTIVE_CLUB.slug}-sofascore-v2026-form1`;
export const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas de cache

export const MOCK_BRASILEIRAO_STANDINGS = [
  { position: 1, teamId: 1958, teamName: "Botafogo", points: 47, matches: 23, wins: 14, draws: 5, losses: 4, goalDiff: 18, form: ["V", "V", "E", "V", "D"], isFlamengo: ACTIVE_CLUB.id === 1958 },
  { position: 2, teamId: 5981, teamName: "Flamengo", points: 46, matches: 22, wins: 14, draws: 4, losses: 4, goalDiff: 17, form: ["V", "V", "E", "V", "V"], isFlamengo: ACTIVE_CLUB.id === 5981 },
  { position: 3, teamId: 1963, teamName: "Palmeiras", points: 44, matches: 23, wins: 13, draws: 5, losses: 5, goalDiff: 15, form: ["V", "E", "V", "V", "V"], isFlamengo: ACTIVE_CLUB.id === 1963 },
  { position: 4, teamId: 2020, teamName: "Fortaleza", points: 42, matches: 22, wins: 12, draws: 6, losses: 4, goalDiff: 10, form: ["E", "V", "D", "V", "E"], isFlamengo: ACTIVE_CLUB.id === 2020 },
  { position: 5, teamId: 1981, teamName: "São Paulo", points: 38, matches: 23, wins: 11, draws: 5, losses: 7, goalDiff: 8, form: ["D", "V", "E", "D", "V"], isFlamengo: ACTIVE_CLUB.id === 1981 },
  { position: 6, teamId: 1954, teamName: "Cruzeiro", points: 37, matches: 23, wins: 11, draws: 4, losses: 8, goalDiff: 6, form: ["E", "D", "V", "E", "D"], isFlamengo: ACTIVE_CLUB.id === 1954 },
  { position: 7, teamId: 1961, teamName: "Bahia", points: 36, matches: 23, wins: 10, draws: 6, losses: 7, goalDiff: 4, form: ["D", "V", "D", "V", "E"], isFlamengo: ACTIVE_CLUB.id === 1961 },
  { position: 8, teamId: 1977, teamName: "Internacional", points: 35, matches: 22, wins: 9, draws: 8, losses: 5, goalDiff: 5, form: ["V", "V", "V", "E", "D"], isFlamengo: ACTIVE_CLUB.id === 1977 },
  { position: 9, teamId: 1975, teamName: "Atlético Mineiro", points: 33, matches: 22, wins: 8, draws: 9, losses: 5, goalDiff: 3, form: ["D", "E", "D", "D", "V"], isFlamengo: ACTIVE_CLUB.id === 1975 },
  { position: 10, teamId: 1976, teamName: "Vasco da Gama", points: 31, matches: 23, wins: 9, draws: 4, losses: 10, goalDiff: -2, form: ["D", "V", "D", "D", "V"], isFlamengo: ACTIVE_CLUB.id === 1976 },
  { position: 11, teamId: 1998, teamName: "Red Bull Bragantino", points: 30, matches: 23, wins: 8, draws: 6, losses: 9, goalDiff: -1, form: ["V", "E", "D", "E", "E"], isFlamengo: ACTIVE_CLUB.id === 1998 },
  { position: 12, teamId: 1962, teamName: "Athletico Paranaense", points: 29, matches: 23, wins: 8, draws: 5, losses: 10, goalDiff: -3, form: ["D", "D", "V", "D", "D"], isFlamengo: ACTIVE_CLUB.id === 1962 },
  { position: 13, teamId: 1959, teamName: "Grêmio", points: 28, matches: 22, wins: 8, draws: 4, losses: 10, goalDiff: -4, form: ["D", "V", "D", "E", "D"], isFlamengo: ACTIVE_CLUB.id === 1959 },
  { position: 14, teamId: 1999, teamName: "Juventude", points: 27, matches: 23, wins: 7, draws: 6, losses: 10, goalDiff: -6, form: ["E", "D", "V", "E", "D"], isFlamengo: ACTIVE_CLUB.id === 1999 },
  { position: 15, teamId: 1984, teamName: "Criciúma", points: 26, matches: 23, wins: 6, draws: 8, losses: 9, goalDiff: -7, form: ["D", "D", "D", "D", "E"], isFlamengo: ACTIVE_CLUB.id === 1984 },
  { position: 16, teamId: 1967, teamName: "Fluminense", points: 25, matches: 23, wins: 6, draws: 7, losses: 10, goalDiff: -8, form: ["V", "E", "D", "E", "V"], isFlamengo: ACTIVE_CLUB.id === 1967 },
  { position: 17, teamId: 1955, teamName: "Corinthians", points: 23, matches: 23, wins: 5, draws: 8, losses: 10, goalDiff: -9, form: ["V", "V", "V", "V", "V"], isFlamengo: ACTIVE_CLUB.id === 1955 },
  { position: 18, teamId: 1974, teamName: "Vitória", points: 22, matches: 23, wins: 5, draws: 7, losses: 11, goalDiff: -11, form: ["V", "D", "V", "D", "E"], isFlamengo: ACTIVE_CLUB.id === 1974 },
  { position: 19, teamId: 1987, teamName: "Cuiabá", points: 19, matches: 22, wins: 4, draws: 7, losses: 11, goalDiff: -13, form: ["D", "D", "D", "E", "D"], isFlamengo: ACTIVE_CLUB.id === 1987 },
  { position: 20, teamId: 1982, teamName: "Atlético Goianiense", points: 15, matches: 23, wins: 3, draws: 6, losses: 14, goalDiff: -17, form: ["E", "D", "D", "V", "D"], isFlamengo: ACTIVE_CLUB.id === 1982 },
];

export const MOCK_LIBERTADORES_GROUPS = [
  {
    groupName: "Grupo E",
    rows: [
      { position: 1, teamId: 1980, teamName: "Bolívar", points: 13, matches: 6, wins: 4, draws: 1, losses: 1, goalDiff: 5, form: ["V", "V", "E", "D", "V"], isFlamengo: false },
      { position: 2, teamId: 5981, teamName: "Flamengo", points: 10, matches: 6, wins: 3, draws: 1, losses: 2, goalDiff: 7, form: ["V", "V", "D", "V", "E"], isFlamengo: ACTIVE_CLUB.id === 5981 },
      { position: 3, teamId: 1992, teamName: "Palestino", points: 7, matches: 6, wins: 2, draws: 1, losses: 3, goalDiff: -5, form: ["E", "D", "V", "D", "D"], isFlamengo: false },
      { position: 4, teamId: 1986, teamName: "Millonarios", points: 3, matches: 6, wins: 0, draws: 3, losses: 3, goalDiff: -7, form: ["D", "E", "D", "E", "E"], isFlamengo: false },
    ],
  },
  {
    groupName: "Grupo A",
    rows: [
      { position: 1, teamId: 1967, teamName: "Fluminense", points: 14, matches: 6, wins: 4, draws: 2, losses: 0, goalDiff: 4, isFlamengo: false },
      { position: 2, teamId: 1990, teamName: "Colo-Colo", points: 6, matches: 6, wins: 1, draws: 3, losses: 2, goalDiff: -1, isFlamengo: false },
      { position: 3, teamId: 1996, teamName: "Cerro Porteño", points: 6, matches: 6, wins: 1, draws: 3, losses: 2, goalDiff: -1, isFlamengo: false },
      { position: 4, teamId: 1988, teamName: "Alianza Lima", points: 4, matches: 6, wins: 0, draws: 4, losses: 2, goalDiff: -2, isFlamengo: false },
    ],
  },
  {
    groupName: "Grupo F",
    rows: [
      { position: 1, teamId: 1963, teamName: "Palmeiras", points: 14, matches: 6, wins: 4, draws: 2, losses: 0, goalDiff: 9, isFlamengo: false },
      { position: 2, teamId: 1995, teamName: "San Lorenzo", points: 8, matches: 6, wins: 2, draws: 2, losses: 2, goalDiff: 0, isFlamengo: false },
      { position: 3, teamId: 1985, teamName: "Independiente del Valle", points: 7, matches: 6, wins: 2, draws: 1, losses: 3, goalDiff: -1, isFlamengo: false },
      { position: 4, teamId: 1991, teamName: "Liverpool M.", points: 4, matches: 6, wins: 1, draws: 1, losses: 4, goalDiff: -8, isFlamengo: false },
    ],
  },
];

export interface TournamentConfig {
  id: number;
  name: string;
  region: string;
  slug: string;
  isLeague: boolean;
  defaultPhase: string;
  defaultColor: string;
}

export const TOURNAMENTS_CONFIG: TournamentConfig[] = [
  {
    id: 325,
    name: "Brasileirão",
    region: "brazil",
    slug: "brasileirao-serie-a",
    isLeague: true,
    defaultPhase: "Tabela Série A 2026",
    defaultColor: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold",
  },
  {
    id: 384,
    name: "Libertadores",
    region: "south-america",
    slug: "conmebol-libertadores",
    isLeague: false,
    defaultPhase: "Fase Eliminatória",
    defaultColor: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold",
  },
  {
    id: 373,
    name: "Copa do Brasil",
    region: "brazil",
    slug: "copa-do-brasil",
    isLeague: false,
    defaultPhase: "Mata-mata",
    defaultColor: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold",
  },
];

export const DEFAULT_CHAMPIONSHIPS: Championship[] = [
  {
    id: "tourn_325",
    url: "https://www.sofascore.com/pt/football/tournament/brazil/brasileirao-serie-a/325",
    name: "Brasileirão",
    status: "2º Lugar (46 pts)",
    phase: "Rodada 24 • Série A 2026",
    color: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold",
    isLeague: true,
    standings: MOCK_BRASILEIRAO_STANDINGS.slice(0, 6),
    fullStandings: MOCK_BRASILEIRAO_STANDINGS,
  },
  {
    id: "tourn_384",
    url: "https://www.sofascore.com/pt/football/tournament/south-america/conmebol-libertadores/384",
    name: "Libertadores",
    status: "Quartas de Final",
    phase: "Mata-Mata Eliminatório 2026",
    color: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold",
    isLeague: false,
    hasKnockout: true,
    hasGroups: true,
    groupTables: MOCK_LIBERTADORES_GROUPS,
    knockout: {
      opponent: "Peñarol",
      phaseName: "Quartas de Final",
      matches: [
        {
          id: 809,
          homeTeam: "Flamengo",
          homeTeamId: 5981,
          awayTeam: "Peñarol",
          awayTeamId: 1993,
          scoreDisplay: "Ida: 0 - 1",
          date: "19/09/2026",
        },
        {
          id: 810,
          homeTeam: "Peñarol",
          homeTeamId: 1993,
          awayTeam: "Flamengo",
          awayTeamId: 5981,
          scoreDisplay: "Volta: 0 - 0",
          date: "26/09/2026",
        },
      ],
    },
  },
  {
    id: "tourn_373",
    url: "https://www.sofascore.com/pt/football/tournament/brazil/copa-do-brasil/373",
    name: "Copa do Brasil",
    status: "Quartas de Final",
    phase: "Mata-Mata Eliminatório 2026",
    color: "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600/60 font-semibold",
    isLeague: false,
    hasKnockout: true,
    knockout: {
      opponent: "Bahia",
      phaseName: "Quartas de Final",
      matches: [
        {
          id: 909,
          homeTeam: "Bahia",
          homeTeamId: 1961,
          awayTeam: "Flamengo",
          awayTeamId: 5981,
          scoreDisplay: "Ida: 0 - 1",
          date: "28/08/2026",
        },
        {
          id: 910,
          homeTeam: "Flamengo",
          homeTeamId: 5981,
          awayTeam: "Bahia",
          awayTeamId: 1961,
          scoreDisplay: "Volta: 1 - 0",
          date: "12/09/2026",
        },
      ],
    },
  },
];

/**
 * Clubes pertencentes à LFU (Liga Forte União) - Mandantes com direitos de Record, Prime Video, CazéTV
 */
export const LFU_TEAMS = [
  "corinthians",
  "cruzeiro",
  "fluminense",
  "vasco",
  "botafogo",
  "internacional",
  "inter",
  "fortaleza",
  "athletico",
  "atlético-pr",
  "atletico-pr",
  "juventude",
  "criciúma",
  "criciuma",
  "cuiabá",
  "cuiaba",
  "atlético-go",
  "atletico-go",
  "sport",
  "ceará",
  "ceara",
  "goiás",
  "goias",
  "avaí",
  "avai",
  "coritiba",
  "américa-mg",
  "america-mg",
];

export const KNOWN_STADIUMS: Record<string, string> = {
  flamengo: "Maracanã",
  corinthians: "Neo Química Arena",
  palmeiras: "Allianz Parque",
  "sao paulo": "MorumBIS",
  santos: "Vila Belmiro",
  vasco: "São Januário",
  fluminense: "Maracanã",
  botafogo: "Nilton Santos",
  gremio: "Arena do Grêmio",
  internacional: "Beira-Rio",
  inter: "Beira-Rio",
  "atletico mg": "Arena MRV",
  "atletico mineiro": "Arena MRV",
  galo: "Arena MRV",
  cruzeiro: "Mineirão",
  bahia: "Arena Fonte Nova",
  vitoria: "Barradão",
  fortaleza: "Arena Castelão",
  ceara: "Arena Castelão",
  "athletico pr": "Ligga Arena",
  "atletico pr": "Ligga Arena",
  athletico: "Ligga Arena",
  coritiba: "Couto Pereira",
  juventude: "Alfredo Jaconi",
  bragantino: "Nabi Abi Chedid",
  "red bull bragantino": "Nabi Abi Chedid",
  cuiaba: "Arena Pantanal",
  "atletico go": "Antônio Accioly",
  goias: "Serrinha",
  criciuma: "Heriberto Hülse",
  sport: "Ilha do Retiro",
  "america mg": "Independência",
  "america mineiro": "Independência",
  avai: "Ressacada",
  chapecoense: "Arena Condá",
  novorizontino: "Jorge Ismael de Biasi",
  mirassol: "José Maria de Campos Maia",
  operario: "Germano Krüger",
  "vila nova": "OBA (Onésio Brasileiro Alvarenga)",
  paysandu: "Curuzu",
  remo: "Baenão",
  amazonas: "Arena da Amazônia",
  guarani: "Brinco de Ouro",
  "ponte preta": "Moisés Lucarelli",
  brusque: "Augusto Bauer",
  ituano: "Novelli Júnior",
  "botafogo sp": "Santa Cruz",
  crb: "Rei Pelé",
  csa: "Rei Pelé",
  "sampaio correa": "Castelão",
  nautico: "Aflitos",
  "santa cruz": "Arruda",
  "volta redonda": "Raulino de Oliveira",
  "nova iguacu": "Laranjão",
  bangu: "Moça Bonita",
  madureira: "Conselheiro Galvão",
  boavista: "Elcyr Resende",
  portuguesa: "Luso-Brasileiro",
  penarol: "Campeón del Siglo",
  nacional: "Gran Parque Central",
  "river plate": "Monumental de Núñez",
  "boca juniors": "La Bombonera",
  racing: "El Cilindro",
  independiente: "Libertadores de América",
  "san lorenzo": "Pedro Bidegain",
  velez: "José Amalfitani",
  estudiantes: "Estádio Jorge Luis Hirschi",
  bolivar: "Hernando Siles",
  "the strongest": "Hernando Siles",
  ldu: "Casa Blanca (Rodrigo Paz Delgado)",
  "independiente del valle": "Banco Guayaquil",
  olimpia: "Defensores del Chaco",
  "cerro porteno": "La Nueva Olla",
  "colo colo": "Monumental David Arellano",
  "alianza lima": "Alejandro Villanueva",
  universitario: "Monumental U",
  libertad: "Tigo La Huerta",
  chelsea: "Stamford Bridge",
  "real madrid": "Santiago Bernabéu",
  bayern: "Allianz Arena",
  psg: "Parc des Princes",
  "manchester city": "Etihad Stadium",
  "al hilal": "Kingdom Arena",
  "al ahly": "Estádio Internacional do Cairo",
};
