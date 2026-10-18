export interface ClubConfig {
  id: number;
  espnId: number;
  name: string;
  shortName: string;
  slug: string;
  nickname: string;
  titleHeader: string;
  badgeUrl: string;
  primaryColor: string;
  sofascoreUrl: string;
}

export const KNOWN_CLUBS: Record<string, ClubConfig> = {
  flamengo: {
    id: 5981,
    espnId: 819,
    name: "Flamengo",
    shortName: "Flamengo",
    slug: "flamengo",
    nickname: "Mengão",
    titleHeader: "E o Mengão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/819.png",
    primaryColor: "bg-red-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/flamengo/5981",
  },
  palmeiras: {
    id: 1963,
    espnId: 2029,
    name: "Palmeiras",
    shortName: "Palmeiras",
    slug: "palmeiras",
    nickname: "Verdão",
    titleHeader: "E o Verdão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/2029.png",
    primaryColor: "bg-emerald-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/palmeiras/1963",
  },
  botafogo: {
    id: 1958,
    espnId: 6086,
    name: "Botafogo",
    shortName: "Botafogo",
    slug: "botafogo",
    nickname: "Fogão",
    titleHeader: "E o Fogão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/6086.png",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/botafogo/1958",
  },
  corinthians: {
    id: 1955,
    espnId: 874,
    name: "Corinthians",
    shortName: "Corinthians",
    slug: "corinthians",
    nickname: "Timão",
    titleHeader: "E o Timão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/874.png",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/corinthians/1955",
  },
  saopaulo: {
    id: 1981,
    espnId: 2026,
    name: "São Paulo",
    shortName: "São Paulo",
    slug: "sao-paulo",
    nickname: "Tricolor",
    titleHeader: "E o Tricolor, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/2026.png",
    primaryColor: "bg-red-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/sao-paulo/1981",
  },
  vasco: {
    id: 1976,
    espnId: 3454,
    name: "Vasco da Gama",
    shortName: "Vasco",
    slug: "vasco-da-gama",
    nickname: "Vascão",
    titleHeader: "E o Vascão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/3454.png",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/vasco-da-gama/1976",
  },
  fluminense: {
    id: 1967,
    espnId: 3445,
    name: "Fluminense",
    shortName: "Fluminense",
    slug: "fluminense",
    nickname: "Fluzão",
    titleHeader: "E o Fluzão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/3445.png",
    primaryColor: "bg-emerald-800 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/fluminense/1967",
  },
  gremio: {
    id: 1959,
    espnId: 6273,
    name: "Grêmio",
    shortName: "Grêmio",
    slug: "gremio",
    nickname: "Imortal",
    titleHeader: "E o Grêmio, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/6273.png",
    primaryColor: "bg-sky-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/gremio/1959",
  },
  internacional: {
    id: 1977,
    espnId: 1936,
    name: "Internacional",
    shortName: "Inter",
    slug: "internacional",
    nickname: "Colorado",
    titleHeader: "E o Colorado, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/1936.png",
    primaryColor: "bg-red-600 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/internacional/1977",
  },
  cruzeiro: {
    id: 1954,
    espnId: 2022,
    name: "Cruzeiro",
    shortName: "Cruzeiro",
    slug: "cruzeiro",
    nickname: "Cabuloso",
    titleHeader: "E o Cabuloso, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/2022.png",
    primaryColor: "bg-blue-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/cruzeiro/1954",
  },
  atleticomineiro: {
    id: 1975,
    espnId: 7632,
    name: "Atlético Mineiro",
    shortName: "Atlético-MG",
    slug: "atletico-mineiro",
    nickname: "Galo",
    titleHeader: "E o Galo, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/7632.png",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/atletico-mineiro/1975",
  },
  santos: {
    id: 1968,
    espnId: 2674,
    name: "Santos",
    shortName: "Santos",
    slug: "santos",
    nickname: "Peixe",
    titleHeader: "E o Peixe, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/2674.png",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/santos/1968",
  },
  bahia: {
    id: 1961,
    espnId: 9967,
    name: "Bahia",
    shortName: "Bahia",
    slug: "bahia",
    nickname: "Esquadrão",
    titleHeader: "E o Bahêa, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/9967.png",
    primaryColor: "bg-blue-600 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/bahia/1961",
  },
  fortaleza: {
    id: 2020,
    espnId: 6272,
    name: "Fortaleza",
    shortName: "Fortaleza",
    slug: "fortaleza",
    nickname: "Leão",
    titleHeader: "E o Leão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/6272.png",
    primaryColor: "bg-blue-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/fortaleza/2020",
  },
  athleticopr: {
    id: 1962,
    espnId: 3458,
    name: "Athletico Paranaense",
    shortName: "Athletico",
    slug: "athletico",
    nickname: "Furacão",
    titleHeader: "E o Furacão, hein?",
    badgeUrl: "https://a.espncdn.com/i/teamlogos/soccer/500/3458.png",
    primaryColor: "bg-red-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/athletico/1962",
  },
};

export function getFavoriteClub(): ClubConfig {
  const envVal = (typeof import.meta.env !== "undefined" && import.meta.env.VITE_FAV_CLUB ? import.meta.env.VITE_FAV_CLUB : "flamengo").toString().trim();
  const normalized = envVal
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  if (Object.prototype.hasOwnProperty.call(KNOWN_CLUBS, normalized)) {
    return KNOWN_CLUBS[normalized] as ClubConfig;
  }

  for (const [key, club] of Object.entries(KNOWN_CLUBS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return club;
    }
  }

  const numericId = parseInt(envVal, 10);
  if (!isNaN(numericId) && numericId > 0) {
    return {
      id: numericId,
      espnId: numericId,
      name: envVal,
      shortName: envVal,
      slug: envVal.toLowerCase().replace(/\s+/g, "-"),
      nickname: envVal,
      titleHeader: `Status - ${envVal}`,
      badgeUrl: `https://a.espncdn.com/i/teamlogos/soccer/500/${numericId}.png`,
      primaryColor: "bg-blue-600 text-white",
      sofascoreUrl: `https://www.sofascore.com/pt/football/team/${numericId}`,
    };
  }

  return KNOWN_CLUBS.flamengo!;
}

export const ACTIVE_CLUB = getFavoriteClub();
