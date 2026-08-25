import { useState } from "react";
import { STORAGE_KEYS } from "../types";

const DEFAULT_WIDGETS = ["flamengo-status", "ufc-upcoming", "trending-streams"];

export function useWidgets() {
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    // Tenta primeiro o novo storage key, senão faz fallback para o antigo
    const saved =
      localStorage.getItem(STORAGE_KEYS.VISIBLE_WIDGETS) ||
      localStorage.getItem("my-homepage-visible-gadgets");

    if (!saved) {
      localStorage.setItem(
        STORAGE_KEYS.VISIBLE_WIDGETS,
        JSON.stringify(DEFAULT_WIDGETS)
      );
      return DEFAULT_WIDGETS;
    }

    try {
      const parsed = JSON.parse(saved) as string[];
      // Migração única para ativar o widget do UFC para usuários existentes
      const hasUfcMigrated = localStorage.getItem("my-homepage-ufc-migrated-v1");
      if (!hasUfcMigrated) {
        localStorage.setItem("my-homepage-ufc-migrated-v1", "true");
        if (!parsed.includes("ufc-upcoming")) {
          const updated = [...parsed, "ufc-upcoming"];
          localStorage.setItem(
            STORAGE_KEYS.VISIBLE_WIDGETS,
            JSON.stringify(updated)
          );
          return updated;
        }
      }
      return parsed;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const toggleWidget = (id: string) => {
    setVisibleWidgets((prev) => {
      const newVisible = prev.includes(id)
        ? prev.filter((g) => g !== id)
        : [...prev, id];
      localStorage.setItem(
        STORAGE_KEYS.VISIBLE_WIDGETS,
        JSON.stringify(newVisible),
      );
      return newVisible;
    });
  };

  return { visibleWidgets, toggleWidget };
}
