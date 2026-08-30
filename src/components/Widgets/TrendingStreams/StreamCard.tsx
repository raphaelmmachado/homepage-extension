import type { StreamItem } from "./types";

interface StreamCardProps {
  item: StreamItem;
  onClick: () => void;
}

export function StreamCard({ item, onClick }: StreamCardProps) {
  return (
    <div
      className="min-w-[130px] max-w-[130px] sm:min-w-[150px] sm:max-w-[150px] flex-none snap-start group cursor-pointer flex flex-col"
      onClick={onClick}
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
  );
}
