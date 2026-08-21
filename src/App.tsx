import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { Bookmark, Container, Layout, Theme } from "./types";
import { STORAGE_KEYS } from "./types";
import { searchEngines, searchOptions } from "./searchEngines";
import type { SearchEngineKey } from "./searchEngines";
import { extractFaviconFromURL } from "./helpers";
import * as svgs from "./svgs";

type DialogConfig = {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
};

const CustomDialog = ({ dialog }: { dialog: DialogConfig }) => {
  if (!dialog.isOpen) return null;
  const isPrompt = dialog.type === 'prompt';
  const isConfirm = dialog.type === 'confirm';
  const [inputValue, setInputValue] = useState(dialog.defaultValue || '');

  // Reset inputValue when dialog opens
  useEffect(() => {
    if (dialog.isOpen) {
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog.isOpen, dialog.defaultValue]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">{dialog.title}</h3>
        {dialog.message && <p className="text-lg text-gray-600 dark:text-gray-300 mb-5 whitespace-pre-wrap">{dialog.message}</p>}
        
        {isPrompt && (
          <input
            type="text"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-none mb-5 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 text-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') dialog.onConfirm?.(inputValue);
              if (e.key === 'Escape') dialog.onCancel?.();
            }}
          />
        )}

        <div className="flex justify-end gap-3 mt-6">
          {(isConfirm || isPrompt) && (
            <button
              onClick={() => dialog.onCancel?.()}
              className="px-5 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg font-medium"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() => dialog.onConfirm?.(isPrompt ? inputValue : undefined)}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-lg font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [dialog, setDialog] = useState<DialogConfig>({ isOpen: false, type: 'alert', title: '', message: '' });

  const showDialog = (options: Omit<DialogConfig, 'isOpen' | 'onConfirm' | 'onCancel'>): Promise<any> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        onConfirm: (val) => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          resolve(options.type === 'prompt' ? (val || null) : true);
        },
        onCancel: () => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          resolve(options.type === 'prompt' ? null : false);
        }
      });
    });
  };
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingContainerTitle, setEditingContainerTitle] = useState("");

  const loadBookmarks = async () => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return;

    const tree = await chrome.bookmarks.getTree();
    
    // We want the Bookmarks Bar, usually id "1"
    const bookmarksBar = tree[0]?.children?.find(node => node.id === "1") || tree[0]?.children?.[0];
    if (!bookmarksBar || !bookmarksBar.children) return;

    const newContainers: Container[] = [];
    const newBookmarks: Bookmark[] = [];
    
    // Load local clicks
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};

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
          clicks: savedClicks[node.url] || 0
        });
      } else {
        // It's a folder (container)
        newContainers.push({
          id: node.id,
          title: node.title
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
                clicks: savedClicks[child.url] || 0
              });
            }
          }
        }
      }
    }

    if (hasLooseBookmarks) {
      newContainers.unshift({
        id: defaultContainerId,
        title: "Barra de Favoritos"
      });
    }

    setContainers(newContainers);
    setBookmarks(newBookmarks);
  };

  useEffect(() => {
    loadBookmarks();

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
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

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId === "top-sites" || destination.droppableId === "top-sites") {
      // Na Opção A, Top Sites é um container automático baseado em cliques
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.move(draggableId, {
        parentId: destination.droppableId,
        index: destination.index
      });
    }
  };

  const handleBookmarkClick = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark || !bookmark.url) return;

    const url = bookmark.url;
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};
    savedClicks[url] = (savedClicks[url] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.BOOKMARK_CLICKS, JSON.stringify(savedClicks));

    setBookmarks((prev) =>
      prev.map((b) => (b.url === url ? { ...b, clicks: savedClicks[url] } : b))
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
  }, [
    containers,
    bookmarks,
    activeSearchEngine,
    currentLayout,
    currentTheme,
  ]);

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

    const exportBookmarks = bookmarks.map((b) => ({
      ...b,
      clicks: savedClicks[b.url] || b.clicks || 0,
    }));

    const data = {
      containers,
      bookmarks: exportBookmarks,
      clicks: savedClicks,
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
      await showDialog({ type: 'alert', title: 'Aviso', message: "A importação direta requer que a extensão esteja rodando no navegador." });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data || (!data.containers && !data.bookmarks)) {
          await showDialog({ type: 'alert', title: 'Aviso', message: "Arquivo JSON inválido ou sem favoritos." });
          return;
        }

        const confirmImport = await showDialog({
          type: 'confirm',
          title: 'Importar Favoritos',
          message: "Deseja importar estes favoritos para o seu navegador?\n\nIsso criará as pastas e links diretamente na sua Barra de Favoritos."
        });
        if (!confirmImport) return;

        // Restaurar contagem de cliques se existirem no backup
        if (
          data.clicks ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: any) => b.clicks))
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
            data.bookmarks.forEach((b: any) => {
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
        await showDialog({ type: 'alert', title: 'Sucesso', message: "Favoritos importados e sincronizados com o navegador com sucesso! 🎉" });
      } catch (err) {
        console.error("Erro na importação:", err);
        await showDialog({ type: 'alert', title: 'Erro', message: "Erro ao importar o arquivo de backup." });
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
    const title = formData.get("name") as string;
    const url = formData.get("url") as string;
    
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      await showDialog({ type: 'alert', title: 'Aviso', message: "A integração de favoritos requer que o app rode como extensão do Chrome/Brave." });
      setIsBookmarkDialogOpen(false);
      return;
    }

    if (editingBookmark) {
      chrome.bookmarks.update(editingBookmark.id, { title, url });
    } else if (activeContainerId) {
      chrome.bookmarks.create({ parentId: activeContainerId, title, url });
    }
    setIsBookmarkDialogOpen(false);
  };

  const deleteBookmark = () => {
    if (editingBookmark) {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        chrome.bookmarks.remove(editingBookmark.id);
      }
      setIsBookmarkDialogOpen(false);
    }
  };

  const addContainer = async () => {
    const title = await showDialog({ type: 'prompt', title: 'Nova Pasta', message: 'Nome da Pasta:' });
    if (title && title.trim()) {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
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
    if (newTitle && newTitle !== containers.find(c => c.id === id)?.title) {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        try {
          await chrome.bookmarks.update(id, { title: newTitle });
          await loadBookmarks();
        } catch (err) {
          console.error("Erro ao renomear pasta:", err);
        }
      }
      setContainers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
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

  const engine = searchEngines[activeSearchEngine];

  const manualTopSites = bookmarks.filter((b) => b.containerId === "top-sites");
  const automaticTopSites = bookmarks
    .filter((b) => b.containerId !== "top-sites" && (b.clicks || 0) > 0)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, Math.max(0, 14 - manualTopSites.length));

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col min-h-screen transition-colors duration-300 font-['Poppins']">
      <nav className="sticky top-0 z-10 py-4 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto flex justify-center gap-4 px-4 max-w-7xl">
          <button
            onClick={toggleTheme}
            className="hidden sm:block text-amber-400 dark:text-gray-300 bg-amber-200 hover:bg-amber-300 dark:bg-gray-600 dark:hover:bg-gray-700 p-3 rounded-full transition-all"
            title="Alterar Tema"
          >
            <div
              dangerouslySetInnerHTML={{
                __html: currentTheme === "light" ? svgs.sunSVG : svgs.moonSVG,
              }}
            />
          </button>

          <button
            onClick={toggleLayout}
            className="hidden sm:block text-gray-600 bg-white hover:bg-white/70 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm p-3 rounded-full transition-all"
            title="Alterar Layout"
          >
            <div
              dangerouslySetInnerHTML={{
                __html: currentLayout === "grid" ? svgs.gridSVG : svgs.listSVG,
              }}
            />
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full max-w-3xl bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 transition-shadow focus-within:ring-2 focus-within:ring-blue-500"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEngineOptionsOpen(!isEngineOptionsOpen)}
                className="p-3 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <div dangerouslySetInnerHTML={{ __html: engine.icon }} />
              </button>
              {isEngineOptionsOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  {Object.entries(searchEngines).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveSearchEngine(key as SearchEngineKey);
                        setIsEngineOptionsOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <div
                        className="w-6 h-6 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: config.icon }}
                      />
                      <span className="text-sm">{config.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              ref={searchInputRef}
              id="web-search-bar"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              onKeyDown={handleSearchBarKeyDown}
              placeholder={engine.placeholder}
              className="w-full bg-transparent pl-2 pr-12 py-2 text-gray-800 dark:text-gray-200 focus:outline-none text-lg"
            />
            <button
              type="submit"
              onMouseDown={handleSearchButtonMouseDown}
              className="absolute right-0 top-0 h-full px-4 text-gray-500 hover:text-blue-600"
            >
              <div dangerouslySetInnerHTML={{ __html: svgs.searchSVG }} />
            </button>
          </form>

          <div className="relative sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-full"
            >
              <div dangerouslySetInnerHTML={{ __html: svgs.chevronDownSVG }} />
            </button>
            {isMobileMenuOpen && (
              <div className="border border-gray-700 shadow-xl absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md z-20">
                <div className="py-1">
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgs.themeIconSvg }}
                    />
                    <span>Alterar Tema</span>
                  </button>
                  <button
                    onClick={toggleLayout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgs.layoutIconSvg }}
                    />
                    <span>Alterar Layout</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgs.importSVG }}
                    />
                    <span>Importar Backup</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgs.exportSVG }}
                    />
                    <span>Exportar Backup</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:block text-gray-600 bg-white hover:bg-white/70 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 p-3 shadow-sm rounded-full transition-all"
            title="Importar Backup para o Navegador"
          >
            <div dangerouslySetInnerHTML={{ __html: svgs.importSVG }} />
          </button>
          <button
            onClick={handleExport}
            className="hidden sm:block text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-white/70 p-3 shadow-sm rounded-full transition-all"
            title="Exportar Backup dos Favoritos"
          >
            <div dangerouslySetInnerHTML={{ __html: svgs.exportSVG }} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".json"
          />
        </div>
      </nav>

      {searchTerm && (
        <div
          className="container mx-auto p-4 md:px-8 max-w-xl flex-grow"
          onKeyDown={handleSearchResultsKeyDown}
          ref={searchResultsRef}
        >
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400">
                🔍 Sites encontrados
              </h2>
              <div dangerouslySetInnerHTML={{ __html: svgs.tabKeySVG }} />
            </div>
            <div className="flex flex-col gap-1">
              {filteredBookmarks.length > 0 ? (
                <>
                  {filteredBookmarks.map((bookmark) => (
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      layout="list"
                      onEdit={() => openEditBookmark(bookmark)}
                      onClickBookmark={handleBookmarkClick}
                    />
                  ))}
                </>
              ) : (
                <>
                  <p className="text-center text-sm text-gray-400 dark:text-gray-600 w-full py-4">
                    Aperte ENTER para pesquisar ou...
                  </p>
                  <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                    💭 Você quer
                  </h2>
                  {searchOptions.map((option) => (
                    <a
                      key={option.name}
                      href={`${option.url}${encodeURIComponent(searchTerm)}`}
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(
                            `${option.url}${encodeURIComponent(searchTerm)}`,
                            "_blank",
                          );
                        }
                      }}
                      className="flex items-center gap-3 my-1 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div dangerouslySetInnerHTML={{ __html: option.icon }} />
                      <span className="text-gray-700 dark:text-gray-200 text-lg">
                        {option.placeholder.replace("{palavra}", searchTerm)}
                      </span>
                    </a>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!searchTerm && (
        <DragDropContext onDragEnd={onDragEnd}>
          <section className="container mx-auto p-4 md:p-8 max-w-7xl flex-grow">
            
            {/* Top Sites Container */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 relative transition-all w-full col-span-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Mais Acessados
                </h2>
              </div>
              <Droppable droppableId="top-sites" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-wrap gap-2 min-h-[50px]"
                  >
                    {/* Automatic Sites (Not Draggable) */}
                    {automaticTopSites.map((bookmark) => (
                      <BookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        layout="grid"
                        onEdit={() => openEditBookmark(bookmark)}
                        onClickBookmark={handleBookmarkClick}
                      />
                    ))}
                    
                    {/* Manual Sites (Draggable) */}
                    {manualTopSites.map((bookmark, index) => (
                      <Draggable key={bookmark.id} draggableId={bookmark.id} index={index}>
                        {(provided, snapshot) => (
                          <BookmarkItem
                            bookmark={bookmark}
                            layout="grid"
                            onEdit={() => openEditBookmark(bookmark)}
                            onClickBookmark={handleBookmarkClick}
                            provided={provided}
                            snapshot={snapshot}
                          />
                        )}
                      </Draggable>
                    ))}
                    
                    {provided.placeholder}
                    <button
                      onClick={() => openAddBookmark("top-sites")}
                      className={`flex p-2 items-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-all duration-300 flex-col justify-center w-20 ${(manualTopSites.length + automaticTopSites.length > 0) ? "opacity-0 hover:opacity-100" : ""}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md border-2 border-dashed border-gray-400 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-600 transition-colors">
                        <div dangerouslySetInnerHTML={{ __html: svgs.addIconSVG }} />
                      </div>
                      <span className="mt-2 text-sm">Adicionar</span>
                    </button>
                  </div>
                )}
              </Droppable>
            </div>

            <div
              className={`grid ${currentLayout === "grid" ? "lg:grid-cols-3 md:grid-cols-2 grid-cols-1" : "lg:grid-cols-4 md:grid-cols-3 grid-cols-2"}  gap-6`}
            >
              {containers.map((container) => (
                <div
                  key={container.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative group transition-all"
                >
                  <div className="flex justify-between items-center mb-4">
                    {editingContainerId === container.id ? (
                      <input
                        type="text"
                        autoFocus
                        className="text-xl font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-none rounded px-2 py-1 flex-grow outline-none focus:ring-2 focus:ring-blue-500 w-full mr-8"
                        value={editingContainerTitle}
                        onChange={(e) => setEditingContainerTitle(e.target.value)}
                        onBlur={() => saveContainerTitle(container.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveContainerTitle(container.id);
                          if (e.key === "Escape") setEditingContainerId(null);
                        }}
                      />
                    ) : (
                      <h2
                        className="text-xl font-bold text-gray-800 dark:text-gray-200 flex-grow cursor-pointer pr-8"
                        onClick={() => {
                          if (container.id !== "1") {
                            setEditingContainerId(container.id);
                            setEditingContainerTitle(container.title);
                          } else {
                            showDialog({ type: 'alert', title: 'Aviso', message: "A Barra de Favoritos padrão do navegador não pode ser renomeada." });
                          }
                        }}
                        title={container.id !== "1" ? "Clique para renomear" : ""}
                      >
                        {container.title}
                      </h2>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContainer(container.id, container.title);
                      }}
                      className="absolute top-3 right-3 w-7 h-7 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-lg opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:!opacity-100 transition-all duration-200 hover:bg-red-500 hover:text-white cursor-pointer z-10"
                      title="Excluir Pasta"
                    >
                      &times;
                    </button>
                  </div>
                  
                  <Droppable droppableId={container.id} direction={currentLayout === "grid" ? "horizontal" : "vertical"}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={
                          currentLayout === "grid"
                            ? "flex flex-wrap gap-2 min-h-[50px]"
                            : "flex flex-col gap-1 min-h-[50px]"
                        }
                      >
                        {bookmarks
                          .filter((b) => b.containerId === container.id)
                          .map((bookmark, index) => (
                            <Draggable key={bookmark.id} draggableId={bookmark.id} index={index}>
                              {(provided, snapshot) => (
                                <BookmarkItem
                                  bookmark={bookmark}
                                  layout={currentLayout}
                                  onEdit={() => openEditBookmark(bookmark)}
                                  onClickBookmark={handleBookmarkClick}
                                  provided={provided}
                                  snapshot={snapshot}
                                />
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        <button
                          onClick={() => openAddBookmark(container.id)}
                          className={`flex p-2 items-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-all duration-300
                            ${currentLayout === "grid" ? "flex-col justify-center w-20" : "w-full"}
                            ${bookmarks.some((b) => b.containerId === container.id) ? "opacity-0 group-hover/category:opacity-100" : "opacity-100"}`}
                        >
                          {currentLayout === "list" ? (
                            <>
                              <span
                                className="mr-2"
                                dangerouslySetInnerHTML={{ __html: svgs.addIconSVG }}
                              />
                              <span className="text-sm">Adicionar</span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center w-8 h-8 rounded-md border-2 border-dashed border-gray-400 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-600 transition-colors">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: svgs.addIconSVG,
                                  }}
                                />
                              </div>
                              <span className="mt-2 text-sm">Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
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

      {isBookmarkDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h3 className="text-2xl font-semibold mb-4">
              {editingBookmark ? "Editar Favorito" : "Adicionar Novo Favorito"}
            </h3>
            <form onSubmit={saveBookmark}>
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Site
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={
                    editingBookmark?.name || editingBookmark?.title || ""
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Ex: Google"
                />
              </div>
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link (URL)
                </label>
                <input
                  type="text"
                  name="url"
                  defaultValue={editingBookmark?.url || ""}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Ex: google.com"
                />
              </div>
              <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingBookmark?.description || ""}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="OPCIONAL: Breve descrição do site"
                />
              </div>
              <div className="flex justify-end space-x-3">
                {editingBookmark && (
                  <button
                    type="button"
                    onClick={deleteBookmark}
                    className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors mr-auto text-lg"
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBookmarkDialogOpen(false)}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BookmarkItem({
  bookmark,
  layout,
  onEdit,
  onClickBookmark,
  provided,
  snapshot,
}: {
  bookmark: Bookmark;
  layout: Layout;
  onEdit: () => void;
  onClickBookmark?: (id: string) => void;
  provided?: any;
  snapshot?: any;
}) {
  const faviconUrl = extractFaviconFromURL(bookmark.url);

  const handleClick = () => {
    if (onClickBookmark) onClickBookmark(bookmark.id);
  };

  if (layout === "list") {
    return (
      <div 
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={`relative flex items-center group/item p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 ${snapshot?.isDragging ? 'opacity-70 bg-gray-200 dark:bg-gray-700 shadow-lg' : ''}`}
      >
        <a
          href={bookmark.url}
          onClick={handleClick}
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              handleClick();
              window.open(bookmark.url, "_blank");
            }
          }}
          className="flex items-center flex-grow"
          title={bookmark.description || ""}
        >
          <img
            src={faviconUrl}
            alt={bookmark.name || bookmark.title}
            className="w-6 h-6 object-contain mr-3 rounded"
          />
          <span className="flex-grow text-sm text-gray-700 dark:text-gray-300 break-words">
            {bookmark.name || bookmark.title}
          </span>
        </a>
        <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`relative flex flex-col items-center group/item w-20 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200 ${snapshot?.isDragging ? 'opacity-70 bg-gray-200 dark:bg-gray-700 shadow-xl scale-105 z-10' : ''}`}
    >
      <a
        href={bookmark.url}
        onClick={handleClick}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            handleClick();
            window.open(bookmark.url, "_blank");
          }
        }}
        className="flex flex-col items-center p-2"
        title={bookmark.description || ""}
      >
        <img
          src={faviconUrl}
          alt={bookmark.name || bookmark.title}
          className="w-7 h-7 object-contain mb-2 rounded-md shadow-sm"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 text-center w-full px-1 break-words whitespace-normal">
          {bookmark.name || bookmark.title}
        </span>
      </a>
      <button
        onClick={onEdit}
        className="absolute top-0 left-0 p-1 text-gray-500 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"
      >
        <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
      </button>
    </div>
  );
}



export default App;
