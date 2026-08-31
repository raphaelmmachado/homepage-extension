import React from "react";
import type { Bookmark, Container } from "../types";
import { searchOptions } from "../searchEngines";
import { extractFaviconFromURL } from "../helpers";
import * as svgs from "../svgs";

type Props = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredBookmarks: Bookmark[];
  containers: Container[];
  searchResultsRef: React.RefObject<HTMLDivElement | null>;
  handleSearchResultsKeyDown: (e: React.KeyboardEvent) => void;
  openEditBookmark: (bookmark: Bookmark) => void;
  onClickBookmark: (url: string) => void;
};

// Destaque sutil e elegante do termo pesquisado
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <span>{text}</span>;

  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query.trim());

  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.trim().length);
  const after = text.slice(index + query.trim().length);

  return (
    <span>
      {before}
      <span className="font-semibold text-blue-600 dark:text-blue-400">
        {match}
      </span>
      <HighlightMatch text={after} query={query} />
    </span>
  );
}

// Comandos de rolagem direta para seções
const sectionCommands = [
  {
    id: "flamengo",
    title: "Flamengo Status",
    description: "Jogos e classificação",
    keywords: ["flamengo", "mengo", "mengao", "futebol", "jogos", "brasileirao", "libertadores", "fla"],
  },
  {
    id: "ufc",
    title: "Próximos Eventos UFC",
    description: "Cards e lutas",
    keywords: ["ufc", "luta", "mma", "combate", "card"],
  },
  {
    id: "streams",
    title: "Filmes & Séries em Alta",
    description: "Lançamentos e tendências",
    keywords: ["streams", "filmes", "series", "filme", "serie", "netflix", "cinema", "stream"],
  },
  {
    id: "topsites",
    title: "Mais Acessados",
    description: "Sites frequentes",
    keywords: ["top", "topsites", "mais acessados", "frequentes"],
  },
  {
    id: "favoritos",
    title: "Pastas de Favoritos",
    description: "Categorias ativas",
    keywords: ["favoritos", "pastas", "categorias", "bookmarks"],
  },
  {
    id: "arquivados",
    title: "Pastas Arquivadas",
    description: "Categorias arquivadas",
    keywords: ["arquivados", "arquivo", "arquivadas"],
  },
];

export function SearchResults({
  searchTerm,
  setSearchTerm,
  filteredBookmarks,
  containers,
  searchResultsRef,
  handleSearchResultsKeyDown,
  openEditBookmark,
  onClickBookmark,
}: Props) {
  if (!searchTerm) return null;

  const normalizedQuery = searchTerm
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Comandos de seção correspondentes
  const matchingCommands = sectionCommands.filter((cmd) =>
    cmd.keywords.some((kw) => kw.includes(normalizedQuery) || normalizedQuery.includes(kw)),
  );

  const getContainerTitle = (containerId: string) => {
    if (containerId === "1" || containerId === "top-sites") return "Barra de Favoritos";
    const found = containers.find((c) => c.id === containerId);
    return found?.title || "Pasta";
  };

  const handleCommandClick = (targetId: string) => {
    setSearchTerm("");
    setTimeout(() => {
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div
      className="container mx-auto px-4 max-w-3xl flex-grow mb-8"
      onKeyDown={handleSearchResultsKeyDown}
      ref={searchResultsRef}
    >
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 w-full flex flex-col gap-4">
        
        {/* 1. SEÇÃO DE FAVORITOS ENCONTRADOS */}
        {filteredBookmarks.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1 mb-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Favoritos ({filteredBookmarks.length})
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                ESC para fechar
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {filteredBookmarks.map((bookmark) => {
                const iconSrc = bookmark.customIcon || extractFaviconFromURL(bookmark.url);
                const folderName = getContainerTitle(bookmark.containerId);
                const cleanUrl = bookmark.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

                return (
                  <div
                    key={bookmark.id}
                    className="group/item flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 focus-within:bg-gray-100 dark:focus-within:bg-gray-700/60 focus-within:ring-2 focus-within:ring-blue-500/50 dark:focus-within:ring-blue-400/40 transition-all duration-150"
                  >
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onClickBookmark(bookmark.url)}
                      className="flex items-center gap-3 flex-grow min-w-0 pr-3 outline-none focus:outline-none"
                    >
                      <img
                        src={iconSrc}
                        alt={bookmark.name || bookmark.title}
                        loading="lazy"
                        className="w-5 h-5 object-contain rounded flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = extractFaviconFromURL(bookmark.url);
                        }}
                      />
                      <div className="flex items-baseline gap-2 min-w-0 flex-grow truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-focus-within/item:text-blue-600 dark:group-focus-within/item:text-blue-400 transition-colors truncate">
                          <HighlightMatch text={bookmark.name || bookmark.title || ""} query={searchTerm} />
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:inline font-normal">
                          {cleanUrl}
                        </span>
                      </div>
                    </a>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded-md font-medium">
                        {folderName}
                      </span>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditBookmark(bookmark);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                        title="Opções do favorito"
                      >
                        <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SEÇÃO DE COMANDOS DE SEÇÃO */}
        {matchingCommands.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Navegar para Seção
            </div>
            <div className="flex flex-col gap-1">
              {matchingCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleCommandClick(cmd.id)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/40 outline-none transition-all duration-150 text-left w-full cursor-pointer group/cmd"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-gray-400 dark:text-gray-500 group-hover/cmd:text-gray-700 dark:group-hover/cmd:text-gray-300 group-focus/cmd:text-blue-600 dark:group-focus/cmd:text-blue-400 text-sm w-5 text-center flex-shrink-0 transition-colors">
                      ↗
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover/cmd:text-blue-600 dark:group-hover/cmd:text-blue-400 group-focus/cmd:text-blue-600 dark:group-focus/cmd:text-blue-400 transition-colors truncate">
                      {cmd.title}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:inline">
                      • {cmd.description}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    Rolar até aqui ↵
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. SEÇÃO DE PESQUISA EXTERNA NA WEB */}
        <div className={`flex flex-col gap-2 ${filteredBookmarks.length > 0 || matchingCommands.length > 0 ? "border-t border-gray-100 dark:border-gray-700/60 pt-3" : ""}`}>
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Pesquisar na Web
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {searchOptions.map((option) => (
              <a
                key={option.name}
                href={`${option.url}${encodeURIComponent(searchTerm)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/40 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:text-gray-900 dark:focus:text-white outline-none transition-all duration-150 group/link"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 opacity-80 group-hover/link:opacity-100 group-focus/link:opacity-100 transition-opacity">
                  <div dangerouslySetInnerHTML={{ __html: option.icon }} />
                </div>
                <span className="text-xs font-medium truncate">
                  {option.name}
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


