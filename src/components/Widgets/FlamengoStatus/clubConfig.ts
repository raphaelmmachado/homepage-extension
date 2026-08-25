export interface ClubConfig {
  id: number;
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
    name: "Flamengo",
    shortName: "Flamengo",
    slug: "flamengo",
    nickname: "Mengão",
    titleHeader: "E o Mengão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/5981/image",
    primaryColor: "bg-red-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/flamengo/5981",
  },
  palmeiras: {
    id: 1963,
    name: "Palmeiras",
    shortName: "Palmeiras",
    slug: "palmeiras",
    nickname: "Verdão",
    titleHeader: "E o Verdão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1963/image",
    primaryColor: "bg-emerald-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/palmeiras/1963",
  },
  botafogo: {
    id: 1958,
    name: "Botafogo",
    shortName: "Botafogo",
    slug: "botafogo",
    nickname: "Fogão",
    titleHeader: "E o Fogão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1958/image",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/botafogo/1958",
  },
  corinthians: {
    id: 1955,
    name: "Corinthians",
    shortName: "Corinthians",
    slug: "corinthians",
    nickname: "Timão",
    titleHeader: "E o Timão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1955/image",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/corinthians/1955",
  },
  saopaulo: {
    id: 1981,
    name: "São Paulo",
    shortName: "São Paulo",
    slug: "sao-paulo",
    nickname: "Tricolor",
    titleHeader: "E o Tricolor, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1981/image",
    primaryColor: "bg-red-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/sao-paulo/1981",
  },
  vasco: {
    id: 1976,
    name: "Vasco da Gama",
    shortName: "Vasco",
    slug: "vasco-da-gama",
    nickname: "Vascão",
    titleHeader: "E o Vascão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1976/image",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/vasco-da-gama/1976",
  },
  fluminense: {
    id: 1967,
    name: "Fluminense",
    shortName: "Fluminense",
    slug: "fluminense",
    nickname: "Fluzão",
    titleHeader: "E o Fluzão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1967/image",
    primaryColor: "bg-emerald-800 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/fluminense/1967",
  },
  gremio: {
    id: 1959,
    name: "Grêmio",
    shortName: "Grêmio",
    slug: "gremio",
    nickname: "Imortal",
    titleHeader: "E o Grêmio, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1959/image",
    primaryColor: "bg-sky-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/gremio/1959",
  },
  internacional: {
    id: 1977,
    name: "Internacional",
    shortName: "Inter",
    slug: "internacional",
    nickname: "Colorado",
    titleHeader: "E o Colorado, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1977/image",
    primaryColor: "bg-red-600 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/internacional/1977",
  },
  cruzeiro: {
    id: 1954,
    name: "Cruzeiro",
    shortName: "Cruzeiro",
    slug: "cruzeiro",
    nickname: "Cabuloso",
    titleHeader: "E o Cabuloso, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1954/image",
    primaryColor: "bg-blue-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/cruzeiro/1954",
  },
  atleticomineiro: {
    id: 1975,
    name: "Atlético Mineiro",
    shortName: "Atlético-MG",
    slug: "atletico-mineiro",
    nickname: "Galo",
    titleHeader: "E o Galo, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1975/image",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/atletico-mineiro/1975",
  },
  santos: {
    id: 1968,
    name: "Santos",
    shortName: "Santos",
    slug: "santos",
    nickname: "Peixe",
    titleHeader: "E o Peixe, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1968/image",
    primaryColor: "bg-neutral-900 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/santos/1968",
  },
  bahia: {
    id: 1961,
    name: "Bahia",
    shortName: "Bahia",
    slug: "bahia",
    nickname: "Esquadrão",
    titleHeader: "E o Bahêa, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1961/image",
    primaryColor: "bg-blue-600 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/bahia/1961",
  },
  fortaleza: {
    id: 2020,
    name: "Fortaleza",
    shortName: "Fortaleza",
    slug: "fortaleza",
    nickname: "Leão",
    titleHeader: "E o Leão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/2020/image",
    primaryColor: "bg-blue-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/fortaleza/2020",
  },
  athleticopr: {
    id: 1962,
    name: "Athletico Paranaense",
    shortName: "Athletico",
    slug: "athletico",
    nickname: "Furacão",
    titleHeader: "E o Furacão, hein?",
    badgeUrl: "https://api.sofascore.app/api/v1/team/1962/image",
    primaryColor: "bg-red-700 text-white",
    sofascoreUrl: "https://www.sofascore.com/pt/football/team/athletico/1962",
  },
};

export function getFavoriteClub(): ClubConfig {
  const envVal = (import.meta.env.VITE_FAV_CLUB || "Flamengo").toString().trim();
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
      name: envVal,
      shortName: envVal,
      slug: envVal.toLowerCase().replace(/\s+/g, "-"),
      nickname: envVal,
      titleHeader: `Status - ${envVal}`,
      badgeUrl: `https://api.sofascore.app/api/v1/team/${numericId}/image`,
      primaryColor: "bg-blue-600 text-white",
      sofascoreUrl: `https://www.sofascore.com/pt/football/team/${numericId}`,
    };
  }

  return KNOWN_CLUBS.flamengo!;
}

export const ACTIVE_CLUB = getFavoriteClub();
