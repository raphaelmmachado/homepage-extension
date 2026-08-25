import React, { useState, useEffect } from "react";
import { StreamDetailsModal } from "./StreamDetailsModal";

export type StreamProvider =
  | "netflix"
  | "amazon-prime-video"
  | "max"
  | "paramount-plus";

interface StreamItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  image: string;
  popularity?: number;
  link?: string;
}

interface TmdbTrendingItem {
  id?: number;
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  poster_path?: string;
  popularity?: number;
}


interface CacheData {
  timestamp: number;
  data: Record<StreamProvider, StreamItem[]>;
}

const PROVIDER_TMDB_IDS: Record<StreamProvider, number> = {
  netflix: 8,
  "amazon-prime-video": 119,
  max: 1899,
  "paramount-plus": 531,
};

const PROVIDERS: { id: StreamProvider; name: string; color: string }[] = [
  {
    id: "netflix",
    name: "Netflix",
    color: "bg-red-600 hover:bg-red-700 text-white",
  },
  {
    id: "amazon-prime-video",
    name: "Prime Video",
    color: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  {
    id: "max",
    name: "HBO Max",
    color: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  {
    id: "paramount-plus",
    name: "Paramount+",
    color: "bg-blue-700 hover:bg-blue-800 text-white",
  },
];

const CACHE_KEY = "my-homepage-trending-streams-v4";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export function TrendingStreams() {
  const [activeTab, setActiveTab] = useState<StreamProvider>("netflix");
  const [selectedStream, setSelectedStream] = useState<StreamItem | null>(null);
  const [streams, setStreams] = useState<Record<StreamProvider, StreamItem[]>>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CacheData;
        return parsed.data;
      } catch {
        // ignore
      }
    }
    return {
      netflix: [],
      "amazon-prime-video": [],
      max: [],
      "paramount-plus": [],
    };
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CacheData;
        return parsed.timestamp;
      } catch {
        // ignore
      }
    }
    return null;
  });

  const fetchProviderData = async (
    provider: StreamProvider,
  ): Promise<StreamItem[]> => {
    try {
      const pId = PROVIDER_TMDB_IDS[provider];
      const apiKey =
        import.meta.env.VITE_TMDB_API_KEY ||
        import.meta.env.TMDB_API_KEY ||
        "3f463306e67d09f9203dcc85fbb35b41";

      const [moviesRes, tvRes] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&region=BR&sort_by=popularity.desc&watch_region=BR&with_watch_providers=${pId}&include_adult=false&page=1`,
        ),
        fetch(
          `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=pt-BR&region=BR&sort_by=popularity.desc&watch_region=BR&with_watch_providers=${pId}&include_adult=false&page=1`,
        ),
      ]);

      const [moviesData, tvData] = await Promise.all([
        moviesRes.ok ? moviesRes.json() : { results: [] },
        tvRes.ok ? tvRes.json() : { results: [] },
      ]);

      const combined: StreamItem[] = [
        ...(moviesData.results || []).map((m: TmdbTrendingItem) => ({
          id: m.id || 0,
          mediaType: "movie" as const,
          title: m.title || m.original_title || "",
          image: m.poster_path
            ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
            : "",
          popularity: m.popularity || 0,
        })),
        ...(tvData.results || []).map((t: TmdbTrendingItem) => ({
          id: t.id || 0,
          mediaType: "tv" as const,
          title: t.name || t.original_name || "",
          image: t.poster_path
            ? `https://image.tmdb.org/t/p/w342${t.poster_path}`
            : "",
          popularity: t.popularity || 0,
        })),
      ]
        .filter((item) => !!item.image && !!item.title)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 15);

      return combined;
    } catch (err) {
      console.error(`Erro ao buscar dados de ${provider} no TMDB:`, err);
      return [];
    }
  };

  const fetchAllProviders = React.useCallback(async (
    existingData?: Record<StreamProvider, StreamItem[]>,
  ) => {
    setLoading(true);

    // Concurrently fetch all
    const results = await Promise.all(
      PROVIDERS.map((p) => fetchProviderData(p.id)),
    );

    const newData: Record<StreamProvider, StreamItem[]> = {
      netflix:
        results[0] && results[0].length > 0
          ? results[0]
          : existingData?.netflix || [],
      "amazon-prime-video":
        results[1] && results[1].length > 0
          ? results[1]
          : existingData?.["amazon-prime-video"] || [],
      max:
        results[2] && results[2].length > 0
          ? results[2]
          : existingData?.max || [],
      "paramount-plus":
        results[3] && results[3].length > 0
          ? results[3]
          : existingData?.["paramount-plus"] || [],
    };

    setStreams(newData);
    const now = Date.now();
    setLastUpdated(now);
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: now, data: newData }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CacheData;

        // Se expirou (mais de 24 horas), atualiza em segundo plano
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          fetchAllProviders(parsed.data);
        }
      } catch {
        fetchAllProviders();
      }
    } else {
      fetchAllProviders();
    }
  }, [fetchAllProviders]);

  const currentItems = streams[activeTab];

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
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
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md transition-all mb-6 relative group/carousel">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Destaques de Streaming
        </h2>

        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setActiveTab(provider.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === provider.id
                  ? provider.color + " shadow-md scale-105"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {provider.name}
            </button>
          ))}
          <button
            onClick={() => fetchAllProviders(streams)}
            disabled={loading}
            className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Atualizar destaques"
          >
            <svg
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
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

      <div className="relative">
        {/* Seta Esquerda */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg cursor-pointer"
          title="Rolar para esquerda"
        >
          &#8249;
        </button>

        {/* Container dos Posters */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex overflow-x-auto gap-4 pb-2 pt-1 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <div
                key={index}
                className="min-w-[120px] max-w-[120px] sm:min-w-[140px] sm:max-w-[140px] flex-none snap-start group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                title={item.title}
                onClick={() => setSelectedStream(item)}
              >
                <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10 backdrop-blur-sm shadow-lg border border-white/10">
                  {index + 1}
                </div>
                <img
                  src={item.image.replace("s332", "s166")} // Optimizando tamanho da imagem
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                  <span className="text-white text-xs font-semibold line-clamp-2 leading-tight">
                    {item.title}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-8 text-gray-500 dark:text-gray-400">
              {loading
                ? "Carregando destaques..."
                : "Nenhum dado encontrado para este streaming no momento."}
            </div>
          )}
        </div>

        {/* Seta Direita */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg cursor-pointer"
          title="Rolar para direita"
        >
          &#8250;
        </button>
      </div>

      {lastUpdated && (
        <div className="text-right mt-2 text-xs text-gray-400 dark:text-gray-500">
          Atualizado em {new Date(lastUpdated).toLocaleDateString("pt-BR")} às{" "}
          {new Date(lastUpdated).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          • Atualização automática a cada 24h
        </div>
      )}
      {selectedStream && (
        <StreamDetailsModal
          item={selectedStream}
          onClose={() => setSelectedStream(null)}
        />
      )}
    </div>
  );
}
