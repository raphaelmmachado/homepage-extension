import type {
  StreamProvider,
  DiscoveryMode,
  MediaTypeFilter,
  GenreFilter,
  StreamItem,
  TmdbItem,
  StreamItemData,
  MovieDetails,
  TmdbVideo,
  TmdbCastMember,
  TmdbCrewMember,
  TmdbGenre,
  TmdbCreator,
} from "../types";
import {
  PROVIDERS,
  GENRES,
  DEFAULT_TMDB_API_KEY,
} from "../constants";

export function getTmdbApiKey(): string {
  return (
    import.meta.env.VITE_TMDB_API_KEY ||
    import.meta.env.TMDB_API_KEY ||
    DEFAULT_TMDB_API_KEY
  );
}

export async function fetchCatalogStreams(
  targetProvider: StreamProvider,
  targetMode: DiscoveryMode,
  targetMediaType: MediaTypeFilter,
  targetGenre: GenreFilter,
): Promise<StreamItem[]> {
  const apiKey = getTmdbApiKey();
  const pConfig = PROVIDERS.find((p) => p.id === targetProvider);
  const pId = pConfig?.tmdbId || 8;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const selectedGenreConfig = GENRES.find((g) => g.id === targetGenre);

  const fetchMovies = async (): Promise<StreamItem[]> => {
    let movieQuery = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&region=BR&watch_region=BR&with_watch_providers=${pId}&include_adult=false&page=1`;

    if (selectedGenreConfig?.movieGenreId) {
      movieQuery += `&with_genres=${selectedGenreConfig.movieGenreId}`;
    }

    if (targetMode === "new_releases") {
      movieQuery += `&sort_by=popularity.desc&primary_release_date.lte=${today}&primary_release_date.gte=${sixMonthsAgo}&vote_count.gte=5`;
    } else if (targetMode === "top_rated") {
      movieQuery += `&sort_by=vote_average.desc&vote_count.gte=150&vote_average.gte=7.0`;
    } else {
      movieQuery += `&sort_by=popularity.desc&primary_release_date.gte=${twoYearsAgo}`;
    }

    const res = await fetch(movieQuery);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: TmdbItem) => ({
      id: m.id || 0,
      mediaType: "movie" as const,
      title: m.title || m.original_title || "",
      image: m.poster_path
        ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
        : "",
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 0,
      voteCount: m.vote_count || 0,
      year: m.release_date ? m.release_date.substring(0, 4) : "",
      overview: m.overview || "",
      popularity: m.popularity || 0,
    }));
  };

  const fetchTv = async (): Promise<StreamItem[]> => {
    let tvQuery = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=pt-BR&region=BR&watch_region=BR&with_watch_providers=${pId}&include_adult=false&page=1`;

    if (selectedGenreConfig?.tvGenreId) {
      tvQuery += `&with_genres=${selectedGenreConfig.tvGenreId}`;
    }

    if (targetMode === "new_releases") {
      tvQuery += `&sort_by=popularity.desc&first_air_date.lte=${today}&first_air_date.gte=${oneYearAgo}&vote_count.gte=5`;
    } else if (targetMode === "top_rated") {
      tvQuery += `&sort_by=vote_average.desc&vote_count.gte=80&vote_average.gte=7.2`;
    } else {
      tvQuery += `&sort_by=popularity.desc&air_date.gte=${twoYearsAgo}`;
    }

    const res = await fetch(tvQuery);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((t: TmdbItem) => ({
      id: t.id || 0,
      mediaType: "tv" as const,
      title: t.name || t.original_name || "",
      image: t.poster_path
        ? `https://image.tmdb.org/t/p/w342${t.poster_path}`
        : "",
      rating: t.vote_average ? Number(t.vote_average.toFixed(1)) : 0,
      voteCount: t.vote_count || 0,
      year: t.first_air_date ? t.first_air_date.substring(0, 4) : "",
      overview: t.overview || "",
      popularity: t.popularity || 0,
    }));
  };

  let combined: StreamItem[] = [];

  if (targetMediaType === "movie") {
    combined = await fetchMovies();
  } else if (targetMediaType === "tv") {
    combined = await fetchTv();
  } else {
    const [movieResults, tvResults] = await Promise.all([
      fetchMovies(),
      fetchTv(),
    ]);
    combined = [...movieResults, ...tvResults];
  }

  combined = combined.filter((item) => !!item.image && !!item.title);

  if (targetMode === "top_rated") {
    combined.sort((a, b) => b.rating - a.rating || b.voteCount - a.voteCount);
  } else {
    combined.sort((a, b) => b.popularity - a.popularity);
  }

  return combined.slice(0, 20);
}

export async function fetchTmdbMediaDetails(
  item: StreamItemData,
): Promise<MovieDetails> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error("Chave da API do TMDB não configurada.");
  }

  let mediaType = item.mediaType;
  let mediaId = item.id;

  // Se o ID não foi passado diretamente, pesquisa pelo título
  if (!mediaId || !mediaType) {
    const cleanTitle = item.title.replace(/\s*\(\d{4}\)$/, "").trim();

    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(
      cleanTitle,
    )}&include_adult=false`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error("Falha ao pesquisar no TMDB");
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      throw new Error(`Nenhum resultado encontrado para "${cleanTitle}"`);
    }

    const media = searchData.results[0];
    mediaType = media.media_type === "tv" ? "tv" : "movie";
    mediaId = media.id;
  }

  // Fetch Details com vídeos em PT e EN em uma ÚNICA requisição
  const detailUrl = `https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${apiKey}&language=pt-BR&append_to_response=videos,credits&include_video_language=pt,en,null`;
  const detailRes = await fetch(detailUrl);
  if (!detailRes.ok) throw new Error("Falha ao obter detalhes no TMDB");
  const detailData = await detailRes.json();

  // Find Trailer (prioriza PT, depois EN)
  const allVideos: TmdbVideo[] = detailData.videos?.results || [];
  const trailer =
    allVideos.find(
      (v: TmdbVideo) =>
        v.site === "YouTube" &&
        v.iso_639_1 === "pt" &&
        (v.type === "Trailer" || v.type === "Teaser"),
    ) ||
    allVideos.find(
      (v: TmdbVideo) =>
        v.site === "YouTube" &&
        (v.type === "Trailer" || v.type === "Teaser"),
    ) ||
    allVideos.find((v: TmdbVideo) => v.site === "YouTube");

  // Extract Cast & Crew
  const castList = (detailData.credits?.cast || [])
    .slice(0, 8)
    .map((c: TmdbCastMember) => ({
      name: c.name,
      character: c.character,
    }));

  const director =
    detailData.credits?.crew?.find((c: TmdbCrewMember) => c.job === "Director")
      ?.name ||
    detailData.created_by?.map((c: TmdbCreator) => c.name).join(", ");

  const genres = (detailData.genres || []).map((g: TmdbGenre) => g.name);
  const year = (
    detailData.release_date ||
    detailData.first_air_date ||
    ""
  ).substring(0, 4);

  let duration: string | undefined;
  if (detailData.runtime) {
    const hours = Math.floor(detailData.runtime / 60);
    const mins = detailData.runtime % 60;
    duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  } else if (detailData.number_of_seasons) {
    duration = `${detailData.number_of_seasons} ${
      detailData.number_of_seasons > 1 ? "Temporadas" : "Temporada"
    }`;
  }

  return {
    title: detailData.title || detailData.name || item.title,
    originalTitle: detailData.original_title || detailData.original_name,
    overview:
      detailData.overview ||
      "Nenhuma sinopse disponível em português no momento.",
    rating: detailData.vote_average
      ? Number(detailData.vote_average.toFixed(1))
      : undefined,
    year: year || undefined,
    genres,
    duration,
    director,
    cast: castList,
    trailerYoutubeKey: trailer?.key,
    posterUrl: detailData.poster_path
      ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}`
      : item.image,
  };
}
