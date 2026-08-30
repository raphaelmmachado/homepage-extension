import type { ProviderConfig, GenreConfig } from "./types";

export const DEFAULT_TMDB_API_KEY = "3f463306e67d09f9203dcc85fbb35b41";

export const PROVIDERS: ProviderConfig[] = [
  { id: "netflix", name: "Netflix", tmdbId: 8 },
  { id: "amazon-prime-video", name: "Prime Video", tmdbId: 119 },
  { id: "max", name: "Max", tmdbId: 1899 },
  { id: "disney-plus", name: "Disney+", tmdbId: 337 },
  { id: "apple-tv-plus", name: "Apple TV+", tmdbId: 350 },
  { id: "paramount-plus", name: "Paramount+", tmdbId: 531 },
];

export const GENRES: GenreConfig[] = [
  { id: "all", label: "Todos os gêneros" },
  { id: "action", label: "Ação e Aventura", movieGenreId: 28, tvGenreId: 10759 },
  { id: "comedy", label: "Comédia", movieGenreId: 35, tvGenreId: 35 },
  { id: "thriller", label: "Suspense e Crime", movieGenreId: 53, tvGenreId: 9648 },
  { id: "scifi", label: "Ficção e Fantasia", movieGenreId: 878, tvGenreId: 10765 },
  { id: "drama", label: "Drama", movieGenreId: 18, tvGenreId: 18 },
  { id: "horror", label: "Terror", movieGenreId: 27, tvGenreId: 9648 },
  { id: "animation", label: "Animação", movieGenreId: 16, tvGenreId: 16 },
  { id: "doc", label: "Documentário", movieGenreId: 99, tvGenreId: 99 },
];

export const CACHE_PREFIX = "my-homepage-streams-v9-";
export const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas

export const DETAILS_CACHE_PREFIX = "my-homepage-tmdb-detail-";
export const DETAILS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias
