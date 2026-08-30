import { useTrendingStreams } from "./useTrendingStreams";
import { StreamFilters } from "./StreamFilters";
import { StreamCard } from "./StreamCard";
import { StreamDetailsModal } from "./StreamDetailsModal";

export function TrendingStreams() {
  const {
    provider,
    setProvider,
    mode,
    setMode,
    mediaType,
    setMediaType,
    genre,
    setGenre,
    items,
    loading,
    selectedStream,
    setSelectedStream,
    isSurprising,
    handleSurpriseMe,
    refreshStreams,
    scrollContainerRef,
    scroll,
    handleWheel,
    resetFilters,
  } = useTrendingStreams();

  return (
    <section id="streams" className="bg-white dark:bg-gray-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/70 shadow-xs mb-6 relative group/carousel transition-colors">
      {/* Controles e Filtros */}
      <StreamFilters
        provider={provider}
        setProvider={setProvider}
        mode={mode}
        setMode={setMode}
        mediaType={mediaType}
        setMediaType={setMediaType}
        genre={genre}
        setGenre={setGenre}
        loading={loading}
        isSurprising={isSurprising}
        hasItems={items.length > 0}
        onSurpriseMe={handleSurpriseMe}
        onRefresh={refreshStreams}
      />

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

        {/* Container do Carrossel */}
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
              <StreamCard
                key={`${item.mediaType}-${item.id}-${index}`}
                item={item}
                onClick={() => setSelectedStream(item)}
              />
            ))
          ) : (
            <div className="w-full text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-2">
              <p className="text-sm">Nenhum título encontrado para estes filtros.</p>
              <button
                onClick={resetFilters}
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

export * from "./types";
export * from "./constants";
export * from "./useTrendingStreams";
export { StreamCard } from "./StreamCard";
export { StreamFilters } from "./StreamFilters";
export { StreamDetailsModal } from "./StreamDetailsModal";
