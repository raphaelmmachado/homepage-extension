export type StreamProvider =
  | "netflix"
  | "amazon-prime-video"
  | "max"
  | "disney-plus"
  | "apple-tv-plus"
  | "paramount-plus";

export type DiscoveryMode = "new_releases" | "top_rated" | "popular";
export type MediaTypeFilter = "all" | "movie" | "tv";
export type GenreFilter =
  | "all"
  | "action"
  | "comedy"
  | "thriller"
  | "scifi"
  | "drama"
  | "horror"
  | "animation"
  | "doc";

export interface StreamItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  image: string;
  rating: number;
  voteCount: number;
  year: string;
  overview: string;
  popularity: number;
}

export interface TmdbItem {
  id?: number;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  poster_path?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  popularity?: number;
}

export interface CacheData {
  timestamp: number;
  items: StreamItem[];
}

export interface StreamItemData {
  id?: number;
  mediaType?: "movie" | "tv";
  title: string;
  image: string;
  link?: string;
}

export interface MovieDetails {
  title: string;
  originalTitle?: string;
  overview: string;
  rating?: number;
  year?: string;
  genres: string[];
  duration?: string;
  director?: string;
  cast: { name: string; character?: string }[];
  trailerYoutubeKey?: string;
  posterUrl?: string;
}

export interface TmdbVideo {
  site?: string;
  iso_639_1?: string;
  type?: string;
  key?: string;
}

export interface TmdbCastMember {
  name: string;
  character?: string;
}

export interface TmdbCrewMember {
  job?: string;
  name: string;
}

export interface TmdbGenre {
  name: string;
}

export interface TmdbCreator {
  name: string;
}

export interface StreamDetailsModalProps {
  item: StreamItemData;
  onClose: () => void;
}

export interface ProviderConfig {
  id: StreamProvider;
  name: string;
  tmdbId: number;
}

export interface GenreConfig {
  id: GenreFilter;
  label: string;
  movieGenreId?: number;
  tvGenreId?: number;
}
