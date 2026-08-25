import { useState, useEffect } from "react";
import type { Layout, Theme } from "../types";
import { STORAGE_KEYS } from "../types";
import type { SearchEngineKey } from "../searchEngines";

export function useSettings() {
  const [activeSearchEngine, setActiveSearchEngine] = useState<SearchEngineKey>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEYS.SEARCH_ENGINE);
      return (saved as SearchEngineKey) || "brave";
    },
  );

  const [currentLayout, setCurrentLayout] = useState<Layout>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT);
    return (saved as Layout) || "grid";
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_ENGINE, activeSearchEngine);
    localStorage.setItem(STORAGE_KEYS.LAYOUT, currentLayout);
    localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);

    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [activeSearchEngine, currentLayout, currentTheme]);

  const toggleTheme = () =>
    setCurrentTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleLayout = () =>
    setCurrentLayout((prev) => (prev === "grid" ? "list" : "grid"));

  return {
    activeSearchEngine,
    setActiveSearchEngine,
    currentLayout,
    currentTheme,
    toggleTheme,
    toggleLayout,
  };
}
