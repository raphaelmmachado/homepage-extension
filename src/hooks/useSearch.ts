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
    if (e.key === "Tab" || (e.key === "ArrowDown" && searchTerm)) {
      if (searchTerm) {
        e.preventDefault();
        requestAnimationFrame(() => {
          if (searchResultsRef.current) {
            const firstFocusable = searchResultsRef.current.querySelector<HTMLElement>(
              "a:not([tabindex='-1']), button:not([tabindex='-1'])",
            );
            if (firstFocusable) {
              firstFocusable.focus();
            }
          }
        });
      }
    }
    if (!searchTerm && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
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
      const items = Array.from(
        searchResultsRef.current?.querySelectorAll<HTMLElement>(
          "a:not([tabindex='-1']), button:not([tabindex='-1'])",
        ) || [],
      );
      const currentIndex = items.indexOf(
        document.activeElement as HTMLElement,
      );

      if (e.key === "ArrowUp" && currentIndex <= 0) {
        // Voltar o foco para a barra de pesquisa
        searchInputRef.current?.focus();
        return;
      }

      let nextIndex;
      if (e.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      } else {
        nextIndex = (currentIndex + 1) % items.length;
      }

      items[nextIndex]?.focus();
    } else if (e.key === "Escape") {
      setSearchTerm("");
      searchInputRef.current?.focus();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    // 0. Comandos de rolagem direta para seções
    const normalized = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^[/#]/, "");

    const sectionCommandsMap: Record<string, string> = {
      flamengo: "flamengo",
      mengo: "flamengo",
      mengao: "flamengo",
      ufc: "ufc",
      streams: "streams",
      filmes: "streams",
      series: "streams",
      topsites: "topsites",
      favoritos: "favoritos",
      arquivados: "arquivados",
    };

    if (sectionCommandsMap[normalized]) {
      const targetId = sectionCommandsMap[normalized];
      setSearchTerm("");
      setTimeout(() => {
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return;
    }

    // 1. Bangs / Prefixos de busca
    if (query.startsWith("!yt ")) {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query.slice(4).trim())}`, "_blank");
      return;
    }
    if (query.startsWith("!g ")) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query.slice(3).trim())}`, "_blank");
      return;
    }
    if (query.startsWith("!b ") || query.startsWith("!brave ")) {
      const q = query.replace(/^!(b|brave)\s+/, "").trim();
      window.open(`https://search.brave.com/search?q=${encodeURIComponent(q)}`, "_blank");
      return;
    }
    if (query.startsWith("!ai ")) {
      window.open(`https://search.brave.com/ask?q=${encodeURIComponent(query.slice(4).trim())}`, "_blank");
      return;
    }
    if (query.startsWith("!t ")) {
      window.open(`https://translate.google.com.br/?sl=auto&tl=pt&text=${encodeURIComponent(query.slice(3).trim())}&op=translate`, "_blank");
      return;
    }
    if (query.startsWith("!ddg ")) {
      window.open(`https://duckduckgo.com/?q=${encodeURIComponent(query.slice(5).trim())}`, "_blank");
      return;
    }
    if (query.startsWith("!dicio ")) {
      window.open(`https://www.dicio.com.br/${encodeURIComponent(query.slice(7).trim())}`, "_blank");
      return;
    }

    // 2. URL direta
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;
    if (urlPattern.test(query)) {
      let url = query;
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }
      window.open(url, "_blank");
      return;
    }

    // 3. Tradutor específico se selecionado no motor
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
      window.open(url, "_blank");
      return;
    }

    const engine = searchEngines[activeSearchEngine];
    const fixedQuery = encodeURIComponent(query).replace(/%20/g, "+");
    window.open(`${engine.url}${fixedQuery}`, "_blank");
  };

  const handleSearchButtonMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle click
      e.preventDefault();
      const query = searchTerm.trim();
      if (query) {
        const engine = searchEngines[activeSearchEngine];
        const fixedQuery = encodeURIComponent(query).replace(/%20/g, "+");
        window.open(`${engine.url}${fixedQuery}`, "_blank");
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
