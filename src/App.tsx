import { useState, useEffect, useRef } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { Bookmark, Container, Layout, Theme } from "./types";
import { STORAGE_KEYS } from "./types";
import { searchEngines } from "./searchEngines";
import type { SearchEngineKey } from "./searchEngines";
import { CustomDialog, type DialogConfig } from "./components/CustomDialog";
import { BookmarkDialog } from "./components/BookmarkDialog";
import { ContainerCard } from "./components/ContainerCard";
import { TopSites } from "./components/TopSites";
import { SearchResults } from "./components/SearchResults";
import { Header } from "./components/Header";
import { TrendingStreams } from "./components/Gadgets/TrendingStreams";
import { FlamengoStatus } from "./components/Gadgets/FlamengoStatus";
import { GadgetsManager } from "./components/Gadgets/GadgetsManager";

// The Chrome extension API is available at runtime but is not included in the
// browser's standard TypeScript globals.
const chrome = (globalThis as typeof globalThis & { chrome?: unknown }).chrome;

function App() {
  const [dialog, setDialog] = useState<DialogConfig>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const showDialog = (
    options: Omit<DialogConfig, "isOpen" | "onConfirm" | "onCancel">,
  ): Promise<string | boolean | null> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        onConfirm: (val) => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          resolve(options.type === "prompt" ? val || null : true);
        },
        onCancel: () => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          resolve(options.type === "prompt" ? null : false);
        },
      });
    });
  };
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(
    null,
  );
  const [editingContainerTitle, setEditingContainerTitle] = useState("");

  const loadBookmarks = async () => {
    if (typeof chrome === "undefined" || !chrome.bookmarks) return;

    const tree = await chrome.bookmarks.getTree();

    // We want the Bookmarks Bar, usually id "1"
    const bookmarksBar =
      tree[0]?.children?.find((node) => node.id === "1") ||
      tree[0]?.children?.[0];
    if (!bookmarksBar || !bookmarksBar.children) return;

    const newContainers: Container[] = [];
    const newBookmarks: Bookmark[] = [];

    // Load local clicks
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};

    // Load custom icons
    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    // Load descriptions
    const savedDescriptionsRaw = localStorage.getItem(
      STORAGE_KEYS.DESCRIPTIONS,
    );
    const savedDescriptions = savedDescriptionsRaw
      ? JSON.parse(savedDescriptionsRaw)
      : {};

    // For any loose bookmarks in Bookmarks Bar, we'll put them in a default container
    const defaultContainerId = "1";
    let hasLooseBookmarks = false;

    for (const node of bookmarksBar.children) {
      if (node.url) {
        // It's a bookmark
        hasLooseBookmarks = true;
        newBookmarks.push({
          id: node.id,
          containerId: defaultContainerId,
          title: node.title,
          name: node.title,
          url: node.url,
          clicks: savedClicks[node.url] || 0,
          customIcon: savedIcons[node.url] || savedIcons[node.id] || undefined,
          description:
            savedDescriptions[node.url] ||
            savedDescriptions[node.id] ||
            undefined,
        });
      } else {
        // It's a folder (container)
        newContainers.push({
          id: node.id,
          title: node.title,
        });

        // Add its children as bookmarks
        if (node.children) {
          for (const child of node.children) {
            if (child.url) {
              newBookmarks.push({
                id: child.id,
                containerId: node.id,
                title: child.title,
                name: child.title,
                url: child.url,
                clicks: savedClicks[child.url] || 0,
                customIcon:
                  savedIcons[child.url] || savedIcons[child.id] || undefined,
                description:
                  savedDescriptions[child.url] ||
                  savedDescriptions[child.id] ||
                  undefined,
              });
            }
          }
        }
      }
    }

    if (hasLooseBookmarks) {
      newContainers.unshift({
        id: defaultContainerId,
        title: "Barra de Favoritos",
      });
    }

    setContainers(newContainers);
    setBookmarks(newBookmarks);
  };

  useEffect(() => {
    loadBookmarks();

    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(loadBookmarks);
      chrome.bookmarks.onRemoved.addListener(loadBookmarks);
      chrome.bookmarks.onChanged.addListener(loadBookmarks);
      chrome.bookmarks.onMoved.addListener(loadBookmarks);
      chrome.bookmarks.onChildrenReordered.addListener(loadBookmarks);

      return () => {
        chrome.bookmarks.onCreated.removeListener(loadBookmarks);
        chrome.bookmarks.onRemoved.removeListener(loadBookmarks);
        chrome.bookmarks.onChanged.removeListener(loadBookmarks);
        chrome.bookmarks.onMoved.removeListener(loadBookmarks);
        chrome.bookmarks.onChildrenReordered.removeListener(loadBookmarks);
      };
    }
  }, []);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isEngineOptionsOpen, setIsEngineOptionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGadgetsManagerOpen, setIsGadgetsManagerOpen] = useState(false);

  const [visibleGadgets, setVisibleGadgets] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VISIBLE_GADGETS);
    return saved ? JSON.parse(saved) : [];
  });

  const toggleGadget = (id: string) => {
    setVisibleGadgets(prev => {
      const newVisible = prev.includes(id) 
        ? prev.filter(g => g !== id)
        : [...prev, id];
      localStorage.setItem(STORAGE_KEYS.VISIBLE_GADGETS, JSON.stringify(newVisible));
      return newVisible;
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (
      source.droppableId === "top-sites" ||
      destination.droppableId === "top-sites"
    ) {
      // Na Opção A, Top Sites é um container automático baseado em cliques
      return;
    }

    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      chrome.bookmarks.move(draggableId, {
        parentId: destination.droppableId,
        index: destination.index,
      });
    }
  };

  const handleBookmarkClick = (id: string) => {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark || !bookmark.url) return;

    const url = bookmark.url;
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};
    savedClicks[url] = (savedClicks[url] || 0) + 1;
    localStorage.setItem(
      STORAGE_KEYS.BOOKMARK_CLICKS,
      JSON.stringify(savedClicks),
    );

    setBookmarks((prev) =>
      prev.map((b) => (b.url === url ? { ...b, clicks: savedClicks[url] } : b)),
    );
  };

  // Modal states
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEARCH_ENGINE, activeSearchEngine);
    localStorage.setItem(STORAGE_KEYS.LAYOUT, currentLayout);
    localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);

    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [containers, bookmarks, activeSearchEngine, currentLayout, currentTheme]);

  const toggleTheme = () =>
    setCurrentTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleLayout = () =>
    setCurrentLayout((prev) => (prev === "grid" ? "list" : "grid"));

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

  const searchResultsRef = useRef<HTMLDivElement>(null);

  const handleSearchBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchTerm("");
    }
    if (e.key === "Tab") {
      if (searchTerm) {
        e.preventDefault(); // Always prevent default tab behavior when results are present
        // Use requestAnimationFrame to wait for the next paint frame, ensuring DOM is ready
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

  const handleExport = () => {
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};

    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    const savedDescriptionsRaw = localStorage.getItem(
      STORAGE_KEYS.DESCRIPTIONS,
    );
    const savedDescriptions = savedDescriptionsRaw
      ? JSON.parse(savedDescriptionsRaw)
      : {};

    const exportBookmarks = bookmarks.map((b) => ({
      ...b,
      clicks: savedClicks[b.url] || b.clicks || 0,
      customIcon: savedIcons[b.url] || savedIcons[b.id] || b.customIcon,
      description:
        savedDescriptions[b.url] || savedDescriptions[b.id] || b.description,
    }));

    const data = {
      containers,
      bookmarks: exportBookmarks,
      clicks: savedClicks,
      customIcons: savedIcons,
      descriptions: savedDescriptions,
      exportDate: new Date().toISOString(),
      version: 2,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homepage-bookmarks-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      await showDialog({
        type: "alert",
        title: "Aviso",
        message:
          "A importação direta requer que a extensão esteja rodando no navegador.",
      });
      return;
    }

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
          return;
        }

        const confirmImport = await showDialog({
          type: "confirm",
          title: "Importar Favoritos",
          message:
            "Deseja importar estes favoritos para o seu navegador?\n\nIsso criará as pastas e links diretamente na sua Barra de Favoritos.",
        });
        if (!confirmImport) return;

        // Restaurar contagem de cliques se existirem no backup
        if (
          data.clicks ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: Bookmark) => b.clicks))
        ) {
          const currentClicksRaw = localStorage.getItem(
            STORAGE_KEYS.BOOKMARK_CLICKS,
          );
          const currentClicks = currentClicksRaw
            ? JSON.parse(currentClicksRaw)
            : {};

          if (data.clicks) {
            Object.assign(currentClicks, data.clicks);
          }
          if (Array.isArray(data.bookmarks)) {
            data.bookmarks.forEach((b: Bookmark) => {
              if (b.url && b.clicks) {
                currentClicks[b.url] = Math.max(
                  currentClicks[b.url] || 0,
                  b.clicks,
                );
              }
            });
          }
          localStorage.setItem(
            STORAGE_KEYS.BOOKMARK_CLICKS,
            JSON.stringify(currentClicks),
          );
        }

        // Restaurar ícones customizados se existirem no backup
        if (
          data.customIcons ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: Bookmark) => b.customIcon))
        ) {
          const currentIconsRaw = localStorage.getItem(
            STORAGE_KEYS.CUSTOM_ICONS,
          );
          const currentIcons = currentIconsRaw
            ? JSON.parse(currentIconsRaw)
            : {};

          if (data.customIcons) {
            Object.assign(currentIcons, data.customIcons);
          }
          if (Array.isArray(data.bookmarks)) {
            data.bookmarks.forEach((b: Bookmark) => {
              if (b.url && b.customIcon) {
                currentIcons[b.url] = b.customIcon;
              }
            });
          }
          localStorage.setItem(
            STORAGE_KEYS.CUSTOM_ICONS,
            JSON.stringify(currentIcons),
          );
        }

        // Restaurar descrições se existirem no backup
        if (
          data.descriptions ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: Bookmark) => b.description))
        ) {
          const currentDescriptionsRaw = localStorage.getItem(
            STORAGE_KEYS.DESCRIPTIONS,
          );
          const currentDescriptions = currentDescriptionsRaw
            ? JSON.parse(currentDescriptionsRaw)
            : {};

          if (data.descriptions) {
            Object.assign(currentDescriptions, data.descriptions);
          }
          if (Array.isArray(data.bookmarks)) {
            data.bookmarks.forEach((b: Bookmark) => {
              if (b.url && b.description) {
                currentDescriptions[b.url] = b.description;
              }
            });
          }
          localStorage.setItem(
            STORAGE_KEYS.DESCRIPTIONS,
            JSON.stringify(currentDescriptions),
          );
        }

        // Mapeamento: ID do container no arquivo -> ID da pasta real no Chrome
        const containerMap = new Map<string, string>();

        // 1. Obter pastas existentes na Barra de Favoritos ("1") para reaproveitar caso já existam
        const tree = await chrome.bookmarks.getTree();
        const bookmarksBar =
          tree[0]?.children?.find((node) => node.id === "1") ||
          tree[0]?.children?.[0];
        const existingFolders = new Map<string, string>();
        if (bookmarksBar?.children) {
          for (const child of bookmarksBar.children) {
            if (!child.url && child.title) {
              existingFolders.set(child.title.toLowerCase().trim(), child.id);
            }
          }
        }

        // 2. Criar pastas para cada container do backup
        if (Array.isArray(data.containers)) {
          for (const container of data.containers) {
            if (
              !container.title ||
              container.id === "1" ||
              container.id === "default-container-1" ||
              container.title === "Barra de Favoritos"
            ) {
              containerMap.set(container.id, "1");
              continue;
            }

            const existingId = existingFolders.get(
              container.title.toLowerCase().trim(),
            );
            if (existingId) {
              containerMap.set(container.id, existingId);
            } else {
              const newFolder = await chrome.bookmarks.create({
                parentId: "1",
                title: container.title,
              });
              containerMap.set(container.id, newFolder.id);
              existingFolders.set(
                container.title.toLowerCase().trim(),
                newFolder.id,
              );
            }
          }
        }

        // 3. Criar os favoritos dentro de suas respectivas pastas
        if (Array.isArray(data.bookmarks)) {
          for (const b of data.bookmarks) {
            if (!b.url) continue;

            const targetParentId = b.containerId
              ? containerMap.get(b.containerId) || "1"
              : "1";
            const title = b.name || b.title || b.url;

            await chrome.bookmarks.create({
              parentId: targetParentId,
              title: title,
              url: b.url,
            });
          }
        }

        await loadBookmarks();
        await showDialog({
          type: "alert",
          title: "Sucesso",
          message:
            "Favoritos importados e sincronizados com o navegador com sucesso! 🎉",
        });
      } catch (err) {
        console.error("Erro na importação:", err);
        await showDialog({
          type: "alert",
          title: "Erro",
          message: "Erro ao importar o arquivo de backup.",
        });
      } finally {
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const openAddBookmark = (containerId: string) => {
    setEditingBookmark(null);
    setActiveContainerId(containerId);
    setIsBookmarkDialogOpen(true);
  };

  const openEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkDialogOpen(true);
  };

  const saveBookmark = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("name") as string)?.trim() || "";
    const url = (formData.get("url") as string)?.trim() || "";
    const customIcon = (formData.get("customIcon") as string)?.trim() || "";

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      await showDialog({
        type: "alert",
        title: "Aviso",
        message:
          "A integração de favoritos requer que o app rode como extensão do Chrome/Brave.",
      });
      setIsBookmarkDialogOpen(false);
      return;
    }

    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    const savedDescriptionsRaw = localStorage.getItem(
      STORAGE_KEYS.DESCRIPTIONS,
    );
    const savedDescriptions = savedDescriptionsRaw
      ? JSON.parse(savedDescriptionsRaw)
      : {};

    const description = (formData.get("description") as string)?.trim() || "";

    if (editingBookmark) {
      if (customIcon) {
        savedIcons[url] = customIcon;
        if (editingBookmark.url && editingBookmark.url !== url) {
          delete savedIcons[editingBookmark.url];
        }
      } else {
        delete savedIcons[url];
        if (editingBookmark.url) {
          delete savedIcons[editingBookmark.url];
        }
      }
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_ICONS,
        JSON.stringify(savedIcons),
      );

      if (description) {
        savedDescriptions[url] = description;
        if (editingBookmark.url && editingBookmark.url !== url) {
          delete savedDescriptions[editingBookmark.url];
        }
      } else {
        delete savedDescriptions[url];
        if (editingBookmark.url) {
          delete savedDescriptions[editingBookmark.url];
        }
      }
      localStorage.setItem(
        STORAGE_KEYS.DESCRIPTIONS,
        JSON.stringify(savedDescriptions),
      );

      await chrome.bookmarks.update(editingBookmark.id, { title, url });
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === editingBookmark.id
            ? {
                ...b,
                name: title,
                title,
                url,
                customIcon: customIcon || undefined,
                description: description || undefined,
              }
            : b,
        ),
      );
    } else if (activeContainerId) {
      if (customIcon) {
        savedIcons[url] = customIcon;
        localStorage.setItem(
          STORAGE_KEYS.CUSTOM_ICONS,
          JSON.stringify(savedIcons),
        );
      }
      if (description) {
        savedDescriptions[url] = description;
        localStorage.setItem(
          STORAGE_KEYS.DESCRIPTIONS,
          JSON.stringify(savedDescriptions),
        );
      }
      await chrome.bookmarks.create({
        parentId: activeContainerId,
        title,
        url,
      });
    }
    setIsBookmarkDialogOpen(false);
  };

  const deleteBookmark = () => {
    if (editingBookmark) {
      if (editingBookmark.url) {
        const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
        if (savedIconsRaw) {
          const savedIcons = JSON.parse(savedIconsRaw);
          delete savedIcons[editingBookmark.url];
          delete savedIcons[editingBookmark.id];
          localStorage.setItem(
            STORAGE_KEYS.CUSTOM_ICONS,
            JSON.stringify(savedIcons),
          );
        }

        const savedDescriptionsRaw = localStorage.getItem(
          STORAGE_KEYS.DESCRIPTIONS,
        );
        if (savedDescriptionsRaw) {
          const savedDescriptions = JSON.parse(savedDescriptionsRaw);
          delete savedDescriptions[editingBookmark.url];
          delete savedDescriptions[editingBookmark.id];
          localStorage.setItem(
            STORAGE_KEYS.DESCRIPTIONS,
            JSON.stringify(savedDescriptions),
          );
        }
      }
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        chrome.bookmarks.remove(editingBookmark.id);
      }
      setIsBookmarkDialogOpen(false);
    }
  };

  const addContainer = async () => {
    const title = await showDialog({
      type: "prompt",
      title: "Nova Pasta",
      message: "Nome da Pasta:",
    });
    if (typeof title === "string" && title.trim()) {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        await chrome.bookmarks.create({ parentId: "1", title: title.trim() });
        await loadBookmarks();
      } else {
        const newId = crypto.randomUUID();
        setContainers((prev) => [...prev, { id: newId, title: title.trim() }]);
      }
    }
  };

  const deleteContainer = async (id: string, title: string) => {
    if (id === "1") {
      const confirmClear = await showDialog({
        type: "confirm",
        title: "Limpar Favoritos",
        message: `Deseja remover todos os favoritos soltos da "${title}"?\n\nISSO APAGARÁ DO SEU NAVEGADOR!`,
      });
      if (confirmClear) {
        if (typeof chrome !== "undefined" && chrome.bookmarks) {
          const loose = bookmarks.filter((b) => b.containerId === "1");
          for (const b of loose) {
            try {
              await chrome.bookmarks.remove(b.id);
            } catch (err) {
              console.error("Erro ao remover favorito:", err);
            }
          }
          await loadBookmarks();
        }
        setBookmarks((prev) => prev.filter((b) => b.containerId !== "1"));
        setContainers((prev) => prev.filter((c) => c.id !== "1"));
      }
      return;
    }

    const confirmDelete = await showDialog({
      type: "confirm",
      title: "Excluir Pasta",
      message: `Tem certeza que deseja remover a pasta "${title}" e todos os seus favoritos?\n\nISSO APAGARÁ DO SEU NAVEGADOR!`,
    });
    if (confirmDelete) {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        try {
          await chrome.bookmarks.removeTree(id);
          await loadBookmarks();
        } catch (err) {
          console.error("Erro ao remover pasta de favoritos:", err);
          await showDialog({
            type: "alert",
            title: "Erro",
            message: "Não foi possível excluir a pasta no navegador.",
          });
        }
      }
      setContainers((prev) => prev.filter((c) => c.id !== id));
      setBookmarks((prev) => prev.filter((b) => b.containerId !== id));
    }
  };

  const saveContainerTitle = async (id: string) => {
    if (!editingContainerId) return;
    const newTitle = editingContainerTitle.trim();
    if (newTitle && newTitle !== containers.find((c) => c.id === id)?.title) {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        try {
          await chrome.bookmarks.update(id, { title: newTitle });
          await loadBookmarks();
        } catch (err) {
          console.error("Erro ao renomear pasta:", err);
        }
      }
      setContainers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      );
    }
    setEditingContainerId(null);
  };

  const filteredBookmarks = searchTerm
    ? bookmarks.filter(
        (b) =>
          (b.name || b.title || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (b.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
    : [];

  const manualTopSites = bookmarks.filter((b) => b.containerId === "top-sites");
  const automaticTopSites = bookmarks
    .filter((b) => b.containerId !== "top-sites" && (b.clicks || 0) > 0)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, Math.max(0, 12 - manualTopSites.length));

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col min-h-screen transition-colors duration-300 font-['Poppins']">
      <Header
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
        currentLayout={currentLayout}
        toggleLayout={toggleLayout}
        isEngineOptionsOpen={isEngineOptionsOpen}
        setIsEngineOptionsOpen={setIsEngineOptionsOpen}
        activeSearchEngine={activeSearchEngine}
        setActiveSearchEngine={setActiveSearchEngine}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearchSubmit={handleSearchSubmit}
        handleSearchButtonMouseDown={handleSearchButtonMouseDown}
        handleSearchBarKeyDown={handleSearchBarKeyDown}
        searchInputRef={searchInputRef}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleExport={handleExport}
        handleImport={handleImport}
        fileInputRef={fileInputRef}
        openGadgetsManager={() => setIsGadgetsManagerOpen(true)}
      />

      <SearchResults
        searchTerm={searchTerm}
        filteredBookmarks={filteredBookmarks}
        searchResultsRef={searchResultsRef}
        handleSearchResultsKeyDown={handleSearchResultsKeyDown}
        openEditBookmark={openEditBookmark}
        onClickBookmark={handleBookmarkClick}
      />

      {!searchTerm && (
        <DragDropContext onDragEnd={onDragEnd}>
          <section className="container mx-auto p-4 md:p-8 max-w-7xl flex-grow">
            {/* Top Sites Container */}
            <TopSites
              automaticTopSites={automaticTopSites}
              manualTopSites={manualTopSites}
              openEditBookmark={openEditBookmark}
              onClickBookmark={handleBookmarkClick}
              openAddBookmark={openAddBookmark}
            />

            {visibleGadgets.includes("trending-streams") && <TrendingStreams />}
            {visibleGadgets.includes("flamengo-status") && <FlamengoStatus />}

            <div
              className={`grid ${currentLayout === "grid" ? "lg:grid-cols-3 md:grid-cols-2 grid-cols-1" : "lg:grid-cols-4 md:grid-cols-3 grid-cols-2"}  gap-6`}
            >
              {containers.map((container) => (
                <ContainerCard
                  key={container.id}
                  container={container}
                  containerBookmarks={bookmarks.filter(
                    (b) => b.containerId === container.id,
                  )}
                  currentLayout={currentLayout}
                  editingContainerId={editingContainerId}
                  editingContainerTitle={editingContainerTitle}
                  setEditingContainerTitle={setEditingContainerTitle}
                  setEditingContainerId={setEditingContainerId}
                  saveContainerTitle={saveContainerTitle}
                  deleteContainer={deleteContainer}
                  openAddBookmark={openAddBookmark}
                  openEditBookmark={openEditBookmark}
                  onClickBookmark={handleBookmarkClick}
                  onShowAlert={(title, message) =>
                    showDialog({ type: "alert", title, message })
                  }
                />
              ))}
              <div
                onClick={addContainer}
                className="cursor-pointer bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 px-8 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center justify-center min-h-[148px]"
              >
                <h2 className="text-xl font-bold text-gray-400 text-center">
                  + Criar Pasta
                </h2>
              </div>
            </div>
          </section>
        </DragDropContext>
      )}

      <CustomDialog dialog={dialog} />

      <BookmarkDialog
        isOpen={isBookmarkDialogOpen}
        editingBookmark={editingBookmark}
        onSave={saveBookmark}
        onDelete={deleteBookmark}
        onClose={() => setIsBookmarkDialogOpen(false)}
      />
      
      <GadgetsManager 
        isOpen={isGadgetsManagerOpen}
        onClose={() => setIsGadgetsManagerOpen(false)}
        visibleGadgets={visibleGadgets}
        toggleGadget={toggleGadget}
      />
    </div>
  );
}

export default App;
