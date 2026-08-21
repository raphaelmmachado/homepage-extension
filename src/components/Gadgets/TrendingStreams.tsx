import React, { useState, useEffect } from "react";

export type StreamProvider = "netflix" | "amazon-prime-video" | "max" | "paramount-plus";

interface StreamItem {
  title: string;
  image: string;
}

interface CacheData {
  timestamp: number;
  data: Record<StreamProvider, StreamItem[]>;
}

const PROVIDERS: { id: StreamProvider; name: string; color: string }[] = [
  { id: "netflix", name: "Netflix", color: "bg-red-600 hover:bg-red-700 text-white" },
  { id: "amazon-prime-video", name: "Prime Video", color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { id: "max", name: "HBO Max", color: "bg-purple-600 hover:bg-purple-700 text-white" },
  { id: "paramount-plus", name: "Paramount+", color: "bg-blue-700 hover:bg-blue-800 text-white" },
];

const CACHE_KEY = "my-homepage-trending-streams";
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

export function TrendingStreams() {
  const [activeTab, setActiveTab] = useState<StreamProvider>("netflix");
  const [streams, setStreams] = useState<Record<StreamProvider, StreamItem[]>>({
    netflix: [],
    "amazon-prime-video": [],
    max: [],
    "paramount-plus": [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CacheData;
        setStreams(parsed.data);
        setLastUpdated(parsed.timestamp);
        
        // If expired, refresh silently
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
          fetchAllProviders(parsed.data);
        }
      } catch (e) {
        fetchAllProviders();
      }
    } else {
      fetchAllProviders();
    }
  }, []);

  const fetchProviderData = async (provider: StreamProvider): Promise<StreamItem[]> => {
    try {
      const res = await fetch(`https://www.justwatch.com/br/provedor/${provider}`);
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
        if (image.startsWith('/')) {
          image = `https://images.justwatch.com${image}`;
        }

        // Avoid duplicates that appear in DOM
        if (!seen.has(title)) {
          seen.add(title);
          results.push({ title, image });
        }
      }
      return results;
    } catch (e) {
      console.error(`Erro ao buscar dados de ${provider}:`, e);
      return [];
    }
  };

  const fetchAllProviders = async (existingData?: Record<StreamProvider, StreamItem[]>) => {
    setLoading(true);
    
    // Concurrently fetch all
    const results = await Promise.all(
      PROVIDERS.map(p => fetchProviderData(p.id))
    );

    const newData: Record<StreamProvider, StreamItem[]> = {
      netflix: results[0] && results[0].length > 0 ? results[0] : (existingData?.netflix || []),
      "amazon-prime-video": results[1] && results[1].length > 0 ? results[1] : (existingData?.["amazon-prime-video"] || []),
      max: results[2] && results[2].length > 0 ? results[2] : (existingData?.max || []),
      "paramount-plus": results[3] && results[3].length > 0 ? results[3] : (existingData?.["paramount-plus"] || []),
    };

    setStreams(newData);
    const now = Date.now();
    setLastUpdated(now);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, data: newData }));
    setLoading(false);
  };

  const currentItems = streams[activeTab];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md transition-all mb-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          🔥 Em Alta
          {loading && (
            <span className="flex h-3 w-3 relative ml-2" title="Atualizando...">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          )}
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
            className="px-3 py-1.5 rounded-full text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Forçar Atualização"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
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
                src={item.image.replace('s332', 's166')} // Optimizando tamanho da imagem
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
            {loading ? "Carregando destaques..." : "Nenhum dado encontrado para este streaming no momento."}
          </div>
        )}
      </div>
      
      {lastUpdated && (
        <div className="text-right mt-2 text-xs text-gray-400 dark:text-gray-500">
          Atualizado às {new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
