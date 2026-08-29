import React, { useState, useEffect, useRef, useCallback } from "react";
import { StreamDetailsModal } from "./StreamDetailsModal";

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

interface TmdbItem {
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

interface CacheData {
  timestamp: number;
  items: StreamItem[];
}

const PROVIDERS: { id: StreamProvider; name: string; tmdbId: number }[] = [
  { id: "netflix", name: "Netflix", tmdbId: 8 },
  { id: "amazon-prime-video", name: "Prime Video", tmdbId: 119 },
  { id: "max", name: "Max", tmdbId: 1899 },
  { id: "disney-plus", name: "Disney+", tmdbId: 337 },
  { id: "apple-tv-plus", name: "Apple TV+", tmdbId: 350 },
  { id: "paramount-plus", name: "Paramount+", tmdbId: 531 },
];

const GENRES: {
  id: GenreFilter;
  label: string;
  movieGenreId?: number;
  tvGenreId?: number;
}[] = [
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

const CACHE_PREFIX = "my-homepage-streams-v9-";
const CACHE_TTL = 12 * 60 * 60 * 1000;

export function TrendingStreams() {
  const [provider, setProvider] = useState<StreamProvider>("netflix");
  const [mode, setMode] = useState<DiscoveryMode>("new_releases");
  const [mediaType, setMediaType] = useState<MediaTypeFilter>("all");
  const [genre, setGenre] = useState<GenreFilter>("all");

  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStream, setSelectedStream] = useState<StreamItem | null>(null);
  const [isSurprising, setIsSurprising] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCacheKey = useCallback(
    (p: StreamProvider, m: DiscoveryMode, mt: MediaTypeFilter, g: GenreFilter) =>
      `${CACHE_PREFIX}${p}_${m}_${mt}_${g}`,
    [],
  );

  const fetchStreams = useCallback(
    async (
      targetProvider: StreamProvider,
      targetMode: DiscoveryMode,
      targetMediaType: MediaTypeFilter,
      targetGenre: GenreFilter,
      forceRefresh = false,
    ) => {
      const cacheKey = getCacheKey(
        targetProvider,
        targetMode,
        targetMediaType,
        targetGenre,
      );

      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed: CacheData = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
              setItems(parsed.items);
              return;
            }
          } catch {
            // ignore cache parse error
          }
        }
      }

      setLoading(true);
      try {
        const apiKey =
          import.meta.env.VITE_TMDB_API_KEY ||
          import.meta.env.TMDB_API_KEY ||
          "3f463306e67d09f9203dcc85fbb35b41";

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
          combined.sort(
            (a, b) => b.rating - a.rating || b.voteCount - a.voteCount,
          );
        } else {
          combined.sort((a, b) => b.popularity - a.popularity);
        }

        const finalItems = combined.slice(0, 20);
        setItems(finalItems);

        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              items: finalItems,
            }),
          );
        } catch {
          // ignore
        }
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
      } finally {
        setLoading(false);
      }
    },
    [getCacheKey],
  );

  useEffect(() => {
    fetchStreams(provider, mode, mediaType, genre);
  }, [provider, mode, mediaType, genre, fetchStreams]);

  const handleSurpriseMe = () => {
    if (items.length === 0) return;
    setIsSurprising(true);

    const candidateList =
      items.filter((it) => it.rating >= 6.8).length > 0
        ? items.filter((it) => it.rating >= 6.8)
        : items;

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * candidateList.length);
      const chosen = candidateList[randomIndex];
      if (chosen) {
        setSelectedStream(chosen);
      }
      setIsSurprising(false);
    }, 350);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -450 : 450;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && e.deltaY !== 0) {
      if (
        scrollContainerRef.current.scrollWidth >
        scrollContainerRef.current.clientWidth
      ) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  return (
    <section className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/70 shadow-xs mb-6 relative group/carousel transition-colors">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-4">
        {/* Título e Provedores */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap mr-1">
            Streaming
          </h2>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl">
            {PROVIDERS.map((p) => {
              const isActive = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xs"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ações de Suporte (Sortear + Atualizar) */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleSurpriseMe}
            disabled={loading || isSurprising || items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
            title="Sortear recomendação aleatória"
          >
            <svg
              className={`w-3.5 h-3.5 ${isSurprising ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M16 8h.01" />
              <path d="M8 8h.01" />
              <path d="M8 16h.01" />
              <path d="M16 16h.01" />
              <path d="M12 12h.01" />
            </svg>
            <span>Sortear</span>
          </button>

          <button
            onClick={() => fetchStreams(provider, mode, mediaType, genre, true)}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer disabled:opacity-40"
            title="Atualizar catálogo"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Refinada */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100 dark:border-gray-700/50 text-xs">
        {/* Modos & Tipos */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Modos */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("new_releases")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === "new_releases"
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Lançamentos
            </button>
            <button
              onClick={() => setMode("top_rated")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === "top_rated"
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Mais Votados
            </button>
            <button
              onClick={() => setMode("popular")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === "popular"
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Populares
            </button>
          </div>

          <span className="text-gray-300 dark:text-gray-700 font-light">|</span>

          {/* Tipo de Mídia */}
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <button
              onClick={() => setMediaType("all")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mediaType === "all"
                  ? "text-gray-900 dark:text-gray-100 font-semibold underline underline-offset-4 decoration-gray-400"
                  : "hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setMediaType("movie")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mediaType === "movie"
                  ? "text-gray-900 dark:text-gray-100 font-semibold underline underline-offset-4 decoration-gray-400"
                  : "hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Filmes
            </button>
            <button
              onClick={() => setMediaType("tv")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mediaType === "tv"
                  ? "text-gray-900 dark:text-gray-100 font-semibold underline underline-offset-4 decoration-gray-400"
                  : "hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Séries
            </button>
          </div>
        </div>

        {/* Gênero */}
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value as GenreFilter)}
          className="bg-transparent text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 cursor-pointer"
        >
          {GENRES.map((g) => (
            <option
              key={g.id}
              value={g.id}
              className="bg-white dark:bg-gray-800"
            >
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* Carrossel de Cards */}
      <div className="relative">
        {/* Seta Esquerda */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/3 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          title="Rolar para esquerda"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Container */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex overflow-x-auto gap-3.5 pb-2 pt-1 px-0.5 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading ? (
            Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={idx}
                className="min-w-[130px] max-w-[130px] sm:min-w-[150px] sm:max-w-[150px] flex-none flex flex-col gap-2 animate-pulse"
              >
                <div className="w-full aspect-[2/3] rounded-xl bg-gray-200 dark:bg-gray-700/60" />
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700/60 rounded w-4/5" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/30 rounded w-1/2" />
              </div>
            ))
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={`${item.mediaType}-${item.id}-${index}`}
                className="min-w-[130px] max-w-[130px] sm:min-w-[150px] sm:max-w-[150px] flex-none snap-start group cursor-pointer flex flex-col"
                onClick={() => setSelectedStream(item)}
              >
                {/* Poster Frame */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 shadow-xs group-hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Rating Tag Minimalista no Topo */}
                  {item.rating > 0 && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-0.5">
                      <span className="text-amber-400">★</span>
                      <span>{item.rating}</span>
                    </div>
                  )}
                </div>

                {/* Metadados Limpos Abaixo do Poster */}
                <div className="mt-2 flex flex-col">
                  <h3
                    className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <span>{item.mediaType === "movie" ? "Filme" : "Série"}</span>
                    {item.year && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span>{item.year}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-2">
              <p className="text-sm">Nenhum título encontrado para estes filtros.</p>
              <button
                onClick={() => {
                  setMode("new_releases");
                  setMediaType("all");
                  setGenre("all");
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Seta Direita */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/3 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          title="Rolar para direita"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Modal de Detalhes */}
      {selectedStream && (
        <StreamDetailsModal
          item={selectedStream}
          onClose={() => setSelectedStream(null)}
        />
      )}
    </section>
  );
}
