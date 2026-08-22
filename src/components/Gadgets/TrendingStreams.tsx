import React, { useState, useEffect } from "react";

export type StreamProvider =
  | "netflix"
  | "amazon-prime-video"
  | "max"
  | "paramount-plus";

interface StreamItem {
  title: string;
  image: string;
}

interface CacheData {
  timestamp: number;
  data: Record<StreamProvider, StreamItem[]>;
}

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

const CACHE_KEY = "my-homepage-trending-streams-v3";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export function TrendingStreams() {
  const [activeTab, setActiveTab] = useState<StreamProvider>("netflix");
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
      const res = await fetch(
        `https://www.justwatch.com/br/provedor/${provider}`,
        {
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        },
      );
      if (!res.ok) return [];
      const html = await res.text();

      const imgRegex = /<img[^>]+alt="([^"]+)"[^>]+src="([^"]+poster[^"]+)"/gi;
      let match;
      const results: StreamItem[] = [];
      const seen = new Set<string>();

      while ((match = imgRegex.exec(html)) !== null && results.length < 10) {
        const title = match[1];
        let image = match[2];

        if (!title || !image) continue;

        // Fix relative URLs if any, though JustWatch usually has absolute ones
        if (image.startsWith("/")) {
          image = `https://images.justwatch.com${image}`;
        }

        // Avoid duplicates that appear in DOM
        if (!seen.has(title)) {
          seen.add(title);
          results.push({ title, image });
        }
      }
      return results;
    } catch (err) {
      console.error(`Erro ao buscar dados de ${provider}:`, err);
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
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md transition-all mb-6 relative group/carousel">
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
            className="p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center"
            title="Atualizar dados agora"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className={`transition-transform duration-500 ${loading ? "animate-spin text-blue-500" : "hover:rotate-180"}`}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
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
                className="min-w-[120px] max-w-[120px] sm:min-w-[140px] sm:max-w-[140px] flex-none snap-start group relative rounded-lg overflow-hidden cursor-pointer"
                title={item.title}
              >
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10 backdrop-blur-sm shadow-lg border border-white/10">
                  {index + 1}
                </div>
                <img
                  src={item.image.replace("s332", "s166")} // Optimizando tamanho da imagem
                  alt={item.title}
                  className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300"
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
    </div>
  );
}
