import type { Bookmark, Container } from "../types";
import { STORAGE_KEYS } from "../types";

export class BookmarkJsonCodec {
  static exportData(bookmarks: Bookmark[], containers: Container[], archivedContainerIds: string[]) {
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};

    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    const savedDescriptionsRaw = localStorage.getItem(STORAGE_KEYS.DESCRIPTIONS);
    const savedDescriptions = savedDescriptionsRaw ? JSON.parse(savedDescriptionsRaw) : {};

    const exportBookmarks = bookmarks.map((b) => ({
      ...b,
      clicks: savedClicks[b.url] || b.clicks || 0,
      customIcon: savedIcons[b.url] || savedIcons[b.id] || b.customIcon,
      description: savedDescriptions[b.url] || savedDescriptions[b.id] || b.description,
    }));

    const data = {
      containers,
      bookmarks: exportBookmarks,
      clicks: savedClicks,
      customIcons: savedIcons,
      descriptions: savedDescriptions,
      archivedContainers: archivedContainerIds,
      exportDate: new Date().toISOString(),
      version: 2,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homepage-bookmarks-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async importData(file: File, showDialog: (opts: unknown) => Promise<unknown>): Promise<boolean> {
    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      await showDialog({
        type: "alert",
        title: "Aviso",
        message: "A importação direta requer que a extensão esteja rodando no navegador.",
      });
      return false;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (!data || (!data.containers && !data.bookmarks)) {
            await showDialog({
              type: "alert",
              title: "Aviso",
              message: "Arquivo JSON inválido ou sem favoritos.",
            });
            resolve(false);
            return;
          }

          const confirmImport = await showDialog({
            type: "confirm",
            title: "Importar Favoritos",
            message: "Deseja importar estes favoritos para o seu navegador?\n\nIsso criará as pastas e links diretamente na sua Barra de Favoritos.",
          });
          
          if (!confirmImport) {
            resolve(false);
            return;
          }

          if (data.clicks || (Array.isArray(data.bookmarks) && data.bookmarks.some((b: Bookmark) => b.clicks))) {
            const currentClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
            const currentClicks = currentClicksRaw ? JSON.parse(currentClicksRaw) : {};
            if (data.clicks) Object.assign(currentClicks, data.clicks);
            if (Array.isArray(data.bookmarks)) {
              data.bookmarks.forEach((b: Bookmark) => {
                if (b.url && b.clicks) currentClicks[b.url] = Math.max(currentClicks[b.url] || 0, b.clicks);
              });
            }
            localStorage.setItem(STORAGE_KEYS.BOOKMARK_CLICKS, JSON.stringify(currentClicks));
          }

          if (data.customIcons || (Array.isArray(data.bookmarks) && data.bookmarks.some((b: Bookmark) => b.customIcon))) {
            const currentIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
            const currentIcons = currentIconsRaw ? JSON.parse(currentIconsRaw) : {};
            if (data.customIcons) Object.assign(currentIcons, data.customIcons);
            if (Array.isArray(data.bookmarks)) {
              data.bookmarks.forEach((b: Bookmark) => {
                if (b.url && b.customIcon) currentIcons[b.url] = b.customIcon;
              });
            }
            localStorage.setItem(STORAGE_KEYS.CUSTOM_ICONS, JSON.stringify(currentIcons));
          }

          if (data.descriptions || (Array.isArray(data.bookmarks) && data.bookmarks.some((b: Bookmark) => b.description))) {
            const currentDescriptionsRaw = localStorage.getItem(STORAGE_KEYS.DESCRIPTIONS);
            const currentDescriptions = currentDescriptionsRaw ? JSON.parse(currentDescriptionsRaw) : {};
            if (data.descriptions) Object.assign(currentDescriptions, data.descriptions);
            if (Array.isArray(data.bookmarks)) {
              data.bookmarks.forEach((b: Bookmark) => {
                if (b.url && b.description) currentDescriptions[b.url] = b.description;
              });
            }
            localStorage.setItem(STORAGE_KEYS.DESCRIPTIONS, JSON.stringify(currentDescriptions));
          }

          const tree = await chrome.bookmarks.getTree();
          const bookmarksBar = tree[0]?.children?.find((node: { id: string }) => node.id === "1") || tree[0]?.children?.[0];
          const existingFolders = new Map<string, string>();
          
          if (bookmarksBar?.children) {
            for (const child of bookmarksBar.children) {
              if (!child.url && child.title) {
                existingFolders.set(child.title.toLowerCase().trim(), child.id);
              }
            }
          }

          const containerMap = new Map<string, string>();
          if (Array.isArray(data.containers)) {
            for (const container of data.containers) {
              if (!container.title || container.id === "1" || container.id === "default-container-1" || container.title === "Barra de Favoritos") {
                containerMap.set(container.id, "1");
                continue;
              }
              const folderName = container.title.trim();
              const folderNameLower = folderName.toLowerCase();
              if (existingFolders.has(folderNameLower)) {
                containerMap.set(container.id, existingFolders.get(folderNameLower)!);
              } else {
                const newFolder = await chrome.bookmarks.create({ parentId: "1", title: folderName });
                containerMap.set(container.id, newFolder.id);
                existingFolders.set(folderNameLower, newFolder.id);
              }
            }
          }

          if (Array.isArray(data.bookmarks)) {
            for (const b of data.bookmarks) {
              const targetParentId = containerMap.get(b.containerId) || "1";
              await chrome.bookmarks.create({ parentId: targetParentId, title: b.title || b.name, url: b.url });
            }
          }
          resolve(true);
        } catch {
          await showDialog({ type: "alert", title: "Erro", message: "Erro ao processar o arquivo de importação." });
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
}
