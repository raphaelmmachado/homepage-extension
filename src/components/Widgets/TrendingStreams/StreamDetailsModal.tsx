import React, { useState, useEffect } from "react";
import type { StreamDetailsModalProps, MovieDetails } from "./types";
import { DETAILS_CACHE_PREFIX, DETAILS_CACHE_TTL } from "./constants";
import { fetchTmdbMediaDetails } from "./services/tmdb";

export function StreamDetailsModal({ item, onClose }: StreamDetailsModalProps) {
  const cacheKey =
    item.id && item.mediaType
      ? `${DETAILS_CACHE_PREFIX}${item.mediaType}-${item.id}`
      : null;

  const [details, setDetails] = useState<MovieDetails | null>(() => {
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < DETAILS_CACHE_TTL) {
            return parsed.data;
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => !details);
  const [error, setError] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Se já temos os detalhes válidos do cache, não gasta requisição API
    if (details) {
      setLoading(false);
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const movieDetails = await fetchTmdbMediaDetails(item);

        if (isMounted) {
          setDetails(movieDetails);

          // Salva no localStorage para as próximas visualizações terem 0 requisições
          const mediaType = item.mediaType || "movie";
          const mediaId = item.id;
          if (mediaId) {
            const resolvedCacheKey = `${DETAILS_CACHE_PREFIX}${mediaType}-${mediaId}`;
            try {
              localStorage.setItem(
                resolvedCacheKey,
                JSON.stringify({
                  timestamp: Date.now(),
                  data: movieDetails,
                }),
              );
            } catch {
              // ignore localStorage quota limit
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || "Não foi possível carregar os detalhes.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [item, cacheKey, details]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-200/80 dark:border-gray-700 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 truncate pr-2">
            <svg
              className="w-5 h-5 text-blue-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <span className="truncate">{details?.title || item.title}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Fechar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="overflow-y-auto p-5">
          {loading ? (
            /* Skeleton Loader Coerente */
            <div className="flex flex-col sm:flex-row gap-5 animate-pulse">
              <div className="w-36 h-52 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 mx-auto sm:mx-0"></div>
              <div className="flex-1 flex flex-col gap-2.5">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full mt-2"></div>
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-2"></div>
              </div>
            </div>
          ) : error ? (
            /* Estado de Erro */
            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
              <p className="text-sm">{error}</p>
            </div>
          ) : details ? (
            /* Detalhes do Filme / Série */
            <div>
              {showTrailer && details.trailerYoutubeKey ? (
                /* Player do Trailer */
                <div className="flex flex-col gap-3">
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <iframe
                      src={`https://www.youtube.com/embed/${details.trailerYoutubeKey}?autoplay=1`}
                      title="Trailer Oficial"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <button
                    onClick={() => setShowTrailer(false)}
                    className="self-start text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← Voltar para sinopse e elenco
                  </button>
                </div>
              ) : (
                /* Informações e Sinopse */
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Poster */}
                  <div className="w-36 flex-shrink-0 mx-auto sm:mx-0">
                    <img
                      src={details.posterUrl || item.image}
                      alt={details.title}
                      className="w-full aspect-[2/3] object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                    />
                  </div>

                  {/* Informações Textuais */}
                  <div className="flex-1 flex flex-col">
                    {/* Título e Metadados */}
                    <div className="mb-2.5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {details.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {details.rating !== undefined && details.rating > 0 && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 px-1.5 py-0.5 rounded font-semibold">
                            ★ {details.rating}
                          </span>
                        )}
                        {details.year && <span>{details.year}</span>}
                        {details.duration && <span>• {details.duration}</span>}
                      </div>
                    </div>

                    {/* Gêneros */}
                    {details.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {details.genres.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium border border-gray-200 dark:border-gray-600"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sinopse */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3.5 whitespace-pre-line line-clamp-6">
                      {details.overview}
                    </p>

                    {/* Direção & Elenco */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/60">
                      {details.director && (
                        <p>
                          <strong className="text-gray-700 dark:text-gray-300">
                            Direção:
                          </strong>{" "}
                          {details.director}
                        </p>
                      )}
                      {details.cast.length > 0 && (
                        <p className="line-clamp-2">
                          <strong className="text-gray-700 dark:text-gray-300">
                            Elenco:
                          </strong>{" "}
                          {details.cast.map((c) => c.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer do Modal com Botões Padronizados */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href={
                item.link
                  ? `https://www.justwatch.com${item.link}`
                  : `https://www.google.com/search?q=${encodeURIComponent(
                      `onde assistir ${details?.title || item.title}`,
                    )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              Ver onde assistir
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {details?.trailerYoutubeKey && !showTrailer && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium py-2 px-4 rounded-xl transition-colors text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Ver Trailer
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
