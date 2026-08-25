import { useState, useRef } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { CustomDialog } from "./components/CustomDialog";

import { BookmarkDialog } from "./components/BookmarkDialog";
import { ContainerCardView } from "./components/ContainerCardView";
import { TopSites } from "./components/TopSites";
import { SearchResults } from "./components/SearchResults";
import { Header } from "./components/Header";
import { ArchivedSection } from "./components/ArchivedSection";
import { TrendingStreams } from "./components/Widgets/TrendingStreams";
import { FlamengoStatus } from "./components/Widgets/FlamengoStatus";
import { UfcStatus } from "./components/Widgets/UfcStatus";
import { WidgetsManager } from "./components/Widgets/WidgetsManager";
import * as svgs from "./svgs";

import { useDialog } from "./hooks/useDialog";
import { useSettings } from "./hooks/useSettings";
import { useWidgets } from "./hooks/useWidgets";
import { useBookmarks } from "./hooks/useBookmarks";
import { useSearch } from "./hooks/useSearch";
import { useContainerDnd } from "./hooks/useContainerDnd";

function App() {
  const { dialog, showDialog } = useDialog();
  const {
    activeSearchEngine,
    setActiveSearchEngine,
    currentLayout,
    currentTheme,
    toggleTheme,
    toggleLayout,
  } = useSettings();

  const { visibleWidgets, toggleWidget } = useWidgets();

  const {
    activeContainers,
    archivedContainers,
    setContainers,
    setArchivedContainerIds,
    archiveContainer,
    unarchiveContainer,
    bookmarks,
    isBookmarkDialogOpen,
    setIsBookmarkDialogOpen,
    editingBookmark,
    editingContainerId,
    editingContainerTitle,
    setEditingContainerTitle,
    setEditingContainerId,
    onDragEnd,
    handleBookmarkClick,
    handleExport,
    handleImport,
    openAddBookmark,
    openEditBookmark,
    saveBookmark,
    deleteBookmark,
    addContainer,
    deleteContainer,
    saveContainerTitle,
  } = useBookmarks(showDialog);

  const {
    draggedContainer,
    dragOverContainerId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDropOnContainer,
    handleDropOnArchivedSection,
    handleDropOnActiveBoard,
  } = useContainerDnd({
    activeContainers,
    archivedContainers,
    setContainers,
    setArchivedContainerIds,
  });

  const {
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
  } = useSearch(
    activeSearchEngine,
    setActiveSearchEngine,
    isBookmarkDialogOpen,
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWidgetsManagerOpen, setIsWidgetsManagerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        openWidgetsManager={() => setIsWidgetsManagerOpen(true)}
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
            {/* 1. Top Sites / Mais Acessados */}
            <TopSites
              automaticTopSites={automaticTopSites}
              manualTopSites={manualTopSites}
              openEditBookmark={openEditBookmark}
              onClickBookmark={handleBookmarkClick}
              openAddBookmark={openAddBookmark}
            />

            {/* 2. Favoritos / Pastas */}
            <div
              className={`grid ${currentLayout === "grid" ? "lg:grid-cols-3 md:grid-cols-2 grid-cols-1" : "lg:grid-cols-4 md:grid-cols-3 grid-cols-2"} gap-6 mb-8`}
            >
              {activeContainers.map((container) => (
                <div key={container.id} className="h-full flex flex-col">
                  <ContainerCardView
                    mode="active"
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
                    onArchiveContainer={archiveContainer}
                    openAddBookmark={openAddBookmark}
                    openEditBookmark={openEditBookmark}
                    onClickBookmark={handleBookmarkClick}
                    onShowAlert={(title, message) =>
                      showDialog({ type: "alert", title, message })
                    }
                    onDragStart={(e) => handleDragStart(container.id, false, e)}
                    onDragOver={(e) => handleDragOver(container.id, e)}
                    onDragLeave={(e) => handleDragLeave(container.id, e)}
                    onDrop={(e) => handleDropOnContainer(container.id, false, e)}
                    isDragging={draggedContainer?.id === container.id}
                    isDragOver={dragOverContainerId === container.id}
                  />
                </div>
              ))}
              <div
                onClick={addContainer}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={handleDropOnActiveBoard}
                className={`group/create-folder cursor-pointer rounded-2xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-3 min-h-[160px] h-full select-none
                  ${
                    activeContainers.length > 0
                      ? "opacity-0 hover:opacity-100 hover:bg-white/80 dark:hover:bg-gray-800/70 hover:backdrop-blur-sm border-2 border-dashed border-transparent hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md px-6 py-8"
                      : "opacity-100 bg-white/40 dark:bg-gray-800/30 hover:bg-white/80 dark:hover:bg-gray-800/70 backdrop-blur-sm border-2 border-dashed border-gray-300/70 dark:border-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 px-6 py-8 shadow-sm hover:shadow-md"
                  }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-100/80 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 group-hover/create-folder:bg-gray-200/80 dark:group-hover/create-folder:bg-gray-600 group-hover/create-folder:text-gray-800 dark:group-hover/create-folder:text-gray-100 group-hover/create-folder:scale-110 flex items-center justify-center transition-all duration-300 shadow-sm border border-gray-200/60 dark:border-gray-700/60 group-hover/create-folder:border-gray-300 dark:group-hover/create-folder:border-gray-500">
                  <div
                    dangerouslySetInnerHTML={{ __html: svgs.folderPlusSVG }}
                    className="w-6 h-6 flex items-center justify-center"
                  />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover/create-folder:text-gray-900 dark:group-hover/create-folder:text-white transition-colors duration-200">
                    Criar Pasta
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">
                    Adicionar nova categoria
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Favoritos / Pastas Arquivadas (seção exibida somente quando não estiver vazia) */}
            <ArchivedSection
              archivedContainers={archivedContainers}
              bookmarks={bookmarks}
              editingContainerId={editingContainerId}
              editingContainerTitle={editingContainerTitle}
              setEditingContainerTitle={setEditingContainerTitle}
              setEditingContainerId={setEditingContainerId}
              saveContainerTitle={saveContainerTitle}
              deleteContainer={deleteContainer}
              unarchiveContainer={unarchiveContainer}
              openAddBookmark={openAddBookmark}
              openEditBookmark={openEditBookmark}
              onClickBookmark={handleBookmarkClick}
              onShowAlert={(title, message) =>
                showDialog({ type: "alert", title, message })
              }
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDropOnContainer={handleDropOnContainer}
              onDropOnArchivedSection={handleDropOnArchivedSection}
              draggedContainer={draggedContainer}
              dragOverContainerId={dragOverContainerId}
            />

            {/* 4. Widgets no fim da página */}
            {visibleWidgets.includes("flamengo-status") && <FlamengoStatus />}
            {visibleWidgets.includes("ufc-upcoming") && <UfcStatus />}
            {visibleWidgets.includes("trending-streams") && <TrendingStreams />}
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

      <WidgetsManager
        isOpen={isWidgetsManagerOpen}
        onClose={() => setIsWidgetsManagerOpen(false)}
        visibleWidgets={visibleWidgets}
        toggleWidget={toggleWidget}
      />
    </div>
  );
}

export default App;
