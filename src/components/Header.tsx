import React from "react";
import type { Theme, Layout } from "../types";
import { searchEngines } from "../searchEngines";
import type { SearchEngineKey } from "../searchEngines";
import * as svgs from "../svgs";

type Props = {
  currentTheme: Theme;
  toggleTheme: () => void;
  currentLayout: Layout;
  toggleLayout: () => void;
  isEngineOptionsOpen: boolean;
  setIsEngineOptionsOpen: (isOpen: boolean) => void;
  activeSearchEngine: SearchEngineKey;
  setActiveSearchEngine: (engine: SearchEngineKey) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleSearchButtonMouseDown: (e: React.MouseEvent) => void;
  handleSearchBarKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openGadgetsManager: () => void;
};

export function Header({
  currentTheme,
  toggleTheme,
  currentLayout,
  toggleLayout,
  isEngineOptionsOpen,
  setIsEngineOptionsOpen,
  activeSearchEngine,
  setActiveSearchEngine,
  searchTerm,
  setSearchTerm,
  handleSearchSubmit,
  handleSearchButtonMouseDown,
  handleSearchBarKeyDown,
  searchInputRef,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleExport,
  handleImport,
  fileInputRef,
  openGadgetsManager,
}: Props) {
  const engine = searchEngines[activeSearchEngine];

  return (
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

        <button
          onClick={openGadgetsManager}
          className="hidden sm:block text-gray-600 bg-white hover:bg-white/70 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm p-3 rounded-full transition-all"
          title="Gerenciar Gadgets"
        >
          <div
            dangerouslySetInnerHTML={{
              __html: svgs.gadgetsIconSvg,
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
                    type="button"
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
                  onClick={() => {
                    openGadgetsManager();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: svgs.gadgetsIconSvg }}
                  />
                  <span>Gerenciar Gadgets</span>
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
  );
}
