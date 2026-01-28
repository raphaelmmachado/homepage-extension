import { useState, useEffect, useRef } from "react";
import type { Bookmark, Container, Article, Layout, Theme } from "./types";
import { STORAGE_KEYS } from "./types";
import { searchEngines, searchOptions } from "./searchEngines";
import type { SearchEngineKey } from "./searchEngines";
import { extractFaviconFromURL } from "./helpers";
import * as svgs from "./svgs";

function App() {
  const [containers, setContainers] = useState<Container[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
    return saved ? JSON.parse(saved) : [];
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return saved ? JSON.parse(saved) : [];
  });
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    return saved ? JSON.parse(saved) : [];
  });
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

  // Modal states
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
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
    articles,
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
        const searchBar = document.getElementById("web-search-bar");
        searchBar?.focus();
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
      if (searchTerm && searchResultsRef.current) {
        const firstLink = searchResultsRef.current.querySelector("a");
        if (firstLink) {
          e.preventDefault();
          firstLink.focus();
        }
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
      document.getElementById("web-search-bar")?.focus();
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
      window.location.href = url;
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
      window.location.href = url;
      return;
    }

    const engine = searchEngines[activeSearchEngine];
    const fixedQuery = encodeURIComponent(query).replace(/%20/g, "+");
    window.location.href = `${engine.url}${fixedQuery}`;
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

  const handleAddArticle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = (formData.get("article-url") as string)?.trim();
    if (!url) return;

    const newArticle: Article = {
      id: crypto.randomUUID(),
      title: url, // Simplified: uses URL as title initially
      description: "Artigo salvo para ler depois",
      url,
      dateAdded: Date.now(),
    };

    setArticles((prev) => [...prev, newArticle]);
    e.currentTarget.reset();
  };

  const deleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.containers) setContainers(data.containers);
        if (data.bookmarks) setBookmarks(data.bookmarks);
        if (data.articles) setArticles(data.articles);
      } catch {
        alert("Erro ao importar arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = { containers, bookmarks, articles };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homepage-bookmarks-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const saveBookmark = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const description = formData.get("description") as string;

    if (editingBookmark) {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === editingBookmark.id
            ? { ...b, name, title: name, url, description }
            : b,
        ),
      );
    } else if (activeContainerId) {
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        containerId: activeContainerId,
        name,
        title: name,
        url,
        description,
      };
      setBookmarks((prev) => [...prev, newBookmark]);
    }
    setIsBookmarkDialogOpen(false);
  };

  const deleteBookmark = () => {
    if (editingBookmark) {
      setBookmarks((prev) => prev.filter((b) => b.id !== editingBookmark.id));
      setIsBookmarkDialogOpen(false);
    }
  };

  const addContainer = () => {
    const title = prompt("Nome da Pasta:");
    if (title?.trim()) {
      setContainers((prev) => [
        ...prev,
        { id: crypto.randomUUID(), title: title.trim() },
      ]);
    }
  };

  const deleteContainer = (id: string, title: string) => {
    if (
      confirm(
        `Tem certeza que deseja remover a pasta "${title}" e todos os seus favoritos?`,
      )
    ) {
      setContainers((prev) => prev.filter((c) => c.id !== id));
      setBookmarks((prev) => prev.filter((b) => b.containerId !== id));
    }
  };

  const renameContainer = (id: string, oldTitle: string) => {
    const newTitle = prompt("Novo nome da pasta:", oldTitle);
    if (newTitle?.trim()) {
      setContainers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c)),
      );
    }
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

  const filteredArticles = searchTerm
    ? articles.filter((a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const engine = searchEngines[activeSearchEngine];

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
                    <span>Importar Favoritos</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgs.exportSVG }}
                    />
                    <span>Exportar Favoritos</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:block text-gray-600 bg-white hover:bg-white/70 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 p-3 shadow-sm rounded-full transition-all"
            title="Importar Favoritos"
          >
            <div dangerouslySetInnerHTML={{ __html: svgs.importSVG }} />
          </button>
          <button
            onClick={handleExport}
            className="hidden sm:block text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-white/70 p-3 shadow-sm rounded-full transition-all"
            title="Exportar Favoritos"
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
              {filteredBookmarks.length > 0 || filteredArticles.length > 0 ? (
                <>
                  {filteredBookmarks.map((bookmark) => (
                    <BookmarkItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      layout="list"
                      onEdit={() => openEditBookmark(bookmark)}
                    />
                  ))}
                  {filteredArticles.map((article) => (
                    <ArticleItem
                      key={article.id}
                      article={article}
                      onDelete={() => deleteArticle(article.id)}
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
        <section className="container mx-auto p-4 md:p-8 max-w-7xl flex-grow">
          <div
            className={`grid ${currentLayout === "grid" ? "lg:grid-cols-3 md:grid-cols-2 grid-cols-1" : "lg:grid-cols-4 md:grid-cols-3 grid-cols-2"}  gap-6`}
          >
            {containers.map((container) => (
              <div
                key={container.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative group/category transition-all"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className="text-xl font-bold text-gray-800 dark:text-gray-200 cursor-pointer flex-grow"
                    onClick={() =>
                      renameContainer(container.id, container.title)
                    }
                  >
                    {container.title}
                  </h2>
                  <button
                    onClick={() =>
                      deleteContainer(container.id, container.title)
                    }
                    className="absolute top-3 right-3 w-7 h-7 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-lg opacity-0 group-hover/category:opacity-100 transition-all duration-200 hover:bg-red-500 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
                <div
                  className={
                    currentLayout === "grid"
                      ? "flex flex-wrap gap-2"
                      : "flex flex-col gap-1"
                  }
                >
                  {bookmarks
                    .filter((b) => b.containerId === container.id)
                    .map((bookmark) => (
                      <BookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        layout={currentLayout}
                        onEdit={() => openEditBookmark(bookmark)}
                      />
                    ))}
                  <button
                    onClick={() => openAddBookmark(container.id)}
                    className={`flex p-2 items-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-all duration-300
                      ${currentLayout === "grid" ? "flex-col justify-center" : ""}
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

          <div id="articles-section" className="mt-12">
            <div className="rounded-lg my-6">
              <form
                onSubmit={handleAddArticle}
                className="flex gap-3 flex-wrap"
              >
                <input
                  type="url"
                  name="article-url"
                  placeholder="Adicione artigos colando o URL do artigo aqui..."
                  required
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                />
                <button
                  type="submit"
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium"
                >
                  Salvar Artigo
                </button>
              </form>
            </div>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
              {articles.map((article) => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  onDelete={() => deleteArticle(article.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

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
}: {
  bookmark: Bookmark;
  layout: Layout;
  onEdit: () => void;
}) {
  const faviconUrl = extractFaviconFromURL(bookmark.url);

  if (layout === "list") {
    return (
      <div className="relative flex items-center group/item p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
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
    <div className="relative flex flex-col items-center group/item w-20 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors duration-200">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
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

function ArticleItem({
  article,
  onDelete,
}: {
  article: Article;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow group relative">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow">
          {article.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(article.dateAdded).toLocaleDateString("pt-BR")}
          </span>
          <div className="flex gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              Ler
            </a>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-blue-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
