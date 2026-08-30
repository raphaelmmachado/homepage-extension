import type {
  StreamProvider,
  DiscoveryMode,
  MediaTypeFilter,
  GenreFilter,
} from "./types";
import { PROVIDERS, GENRES } from "./constants";

interface StreamFiltersProps {
  provider: StreamProvider;
  setProvider: (p: StreamProvider) => void;
  mode: DiscoveryMode;
  setMode: (m: DiscoveryMode) => void;
  mediaType: MediaTypeFilter;
  setMediaType: (mt: MediaTypeFilter) => void;
  genre: GenreFilter;
  setGenre: (g: GenreFilter) => void;
  loading: boolean;
  isSurprising: boolean;
  hasItems: boolean;
  onSurpriseMe: () => void;
  onRefresh: () => void;
}

export function StreamFilters({
  provider,
  setProvider,
  mode,
  setMode,
  mediaType,
  setMediaType,
  genre,
  setGenre,
  loading,
  isSurprising,
  hasItems,
  onSurpriseMe,
  onRefresh,
}: StreamFiltersProps) {
  return (
    <>
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
            onClick={onSurpriseMe}
            disabled={loading || isSurprising || !hasItems}
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
            onClick={onRefresh}
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
    </>
  );
}
