import { useState, useEffect, useRef, useCallback } from "react";
import type {
  StreamProvider,
  DiscoveryMode,
  MediaTypeFilter,
  GenreFilter,
  StreamItem,
  CacheData,
} from "./types";
import { CACHE_PREFIX, CACHE_TTL } from "./constants";
import { fetchCatalogStreams } from "./services/tmdb";

export function useTrendingStreams() {
  const [provider, setProvider] = useState<StreamProvider>("netflix");
  const [mode, setMode] = useState<DiscoveryMode>("new_releases");
  const [mediaType, setMediaType] = useState<MediaTypeFilter>("all");
  const [genre, setGenre] = useState<GenreFilter>("all");

  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStream, setSelectedStream] = useState<StreamItem | null>(null);
  const [isSurprising, setIsSurprising] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const getCacheKey = useCallback(
    (p: StreamProvider, m: DiscoveryMode, mt: MediaTypeFilter, g: GenreFilter) =>
      `${CACHE_PREFIX}${p}_${m}_${mt}_${g}`,
    [],
  );

  const loadStreams = useCallback(
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
        const finalItems = await fetchCatalogStreams(
          targetProvider,
          targetMode,
          targetMediaType,
          targetGenre,
        );
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
    loadStreams(provider, mode, mediaType, genre);
  }, [provider, mode, mediaType, genre, loadStreams]);

  const refreshStreams = useCallback(() => {
    loadStreams(provider, mode, mediaType, genre, true);
  }, [provider, mode, mediaType, genre, loadStreams]);

  const handleSurpriseMe = useCallback(() => {
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
  }, [items]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -450 : 450;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollContainerRef.current && e.deltaY !== 0) {
      if (
        scrollContainerRef.current.scrollWidth >
        scrollContainerRef.current.clientWidth
      ) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  }, []);

  const resetFilters = useCallback(() => {
    setMode("new_releases");
    setMediaType("all");
    setGenre("all");
  }, []);

  return {
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
  };
}
