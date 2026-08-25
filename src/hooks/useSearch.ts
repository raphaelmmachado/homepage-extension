import { useState, useRef, useEffect } from "react";
import { searchEngines } from "../searchEngines";
import type { SearchEngineKey } from "../searchEngines";

export function useSearch(
  activeSearchEngine: SearchEngineKey,
  setActiveSearchEngine: (engine: SearchEngineKey) => void,
  isBookmarkDialogOpen: boolean
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEngineOptionsOpen, setIsEngineOptionsOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      // Focus search bar on typing if not in input
      if (
        key.length === 1 &&
        !isBookmarkDialogOpen &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBookmarkDialogOpen]);

  const handleSearchBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchTerm("");
    }
    if (e.key === "Tab") {
      if (searchTerm) {
        e.preventDefault();
        requestAnimationFrame(() => {
          if (searchResultsRef.current) {
            const firstLink = searchResultsRef.current.querySelector("a");
            if (firstLink) {
              firstLink.focus();
            }
          }
        });
      }
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const engineKeys = Object.keys(searchEngines) as SearchEngineKey[];
      let currentIndex = engineKeys.indexOf(activeSearchEngine);
      if (e.key === "ArrowUp") {
        currentIndex =
          (currentIndex - 1 + engineKeys.length) % engineKeys.length;
      } else {
        currentIndex = (currentIndex + 1) % engineKeys.length;
      }
      setActiveSearchEngine(engineKeys[currentIndex]!);
    }
  };

  const handleSearchResultsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const links = Array.from(
        searchResultsRef.current?.querySelectorAll("a") || [],
      );
      const currentIndex = links.indexOf(
        document.activeElement as HTMLAnchorElement,
      );

      let nextIndex;
      if (e.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + links.length) % links.length;
      } else {
        nextIndex = (currentIndex + 1) % links.length;
      }

      links[nextIndex]?.focus();
    } else if (e.key === "Escape") {
      setSearchTerm("");
      searchInputRef.current?.focus();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    // URL detection
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;
    if (urlPattern.test(query)) {
      let url = query;
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
      window.open(url, "_self");
      return;
    }

    // Google Translate specific logic
    if (searchEngines[activeSearchEngine].name === "Tradutor") {
      const q = query.split(" ");
      let url = "";
      if (
        q.length >= 2 &&
        q[q.length - 2]!.length === 2 &&
        q[q.length - 1]!.length === 2
      ) {
        url = `https://translate.google.com.br/?sl=${q[q.length - 2]}&tl=${
          q[q.length - 1]
        }&text=${encodeURIComponent(q[0]!)}&op=translate`;
      } else {
        url = `https://translate.google.com.br/?sl=auto&tl=pt&text=${encodeURIComponent(
          query,
        )}&op=translate`;
      }
      window.open(url, "_self");
      return;
    }

    const engine = searchEngines[activeSearchEngine];
    const fixedQuery = encodeURIComponent(query).replace(/%20/g, "+");
    window.open(`${engine.url}${fixedQuery}`, "_self");
  };

  const handleSearchButtonMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle click
      e.preventDefault();
      const query = searchTerm.trim();
      if (query) {
        const engine = searchEngines[activeSearchEngine];
        const fixedQuery = encodeURIComponent(query).replace(/%20/g, "+");
        window.open(`${engine.url}${fixedQuery}`, "_self");
      }
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    isEngineOptionsOpen,
    setIsEngineOptionsOpen,
    searchInputRef,
    searchResultsRef,
    handleSearchBarKeyDown,
    handleSearchResultsKeyDown,
    handleSearchSubmit,
    handleSearchButtonMouseDown,
  };
}
