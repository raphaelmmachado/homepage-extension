import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Container, Bookmark, Layout } from "../types";
import { BookmarkItem } from "./BookmarkItem";
import * as svgs from "../svgs";

type Props = {
  mode?: "active" | "archived";
  container: Container;
  containerBookmarks: Bookmark[];
  currentLayout?: Layout;
  editingContainerId: string | null;
  editingContainerTitle: string;
  setEditingContainerTitle: (title: string) => void;
  setEditingContainerId: (id: string | null) => void;
  saveContainerTitle: (id: string) => void;
  deleteContainer: (id: string, title: string) => void;
  onArchiveContainer?: (id: string) => void;
  openAddBookmark: (containerId: string) => void;
  openEditBookmark: (bookmark: Bookmark) => void;
  onClickBookmark: (id: string) => void;
  onShowAlert: (title: string, message: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
};

export function ContainerCardView({
  container,
  containerBookmarks,
  currentLayout = "grid",
  editingContainerId,
  editingContainerTitle,
  setEditingContainerTitle,
  setEditingContainerId,
  saveContainerTitle,
  deleteContainer,
  onArchiveContainer,
  openAddBookmark,
  openEditBookmark,
  onClickBookmark,
  onShowAlert,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  isDragOver,
}: Props) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md relative group/category transition-all duration-200 flex flex-col h-full ${
        isDragging ? "opacity-30 scale-[0.98] border-dashed border-2 border-blue-400 dark:border-blue-500 shadow-xl" : ""
      } ${
        isDragOver ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 border-blue-500 scale-[1.02] shadow-xl" : ""
      }`}
    >
      <div 
        draggable={true}
        onDragStart={onDragStart}
        className="flex justify-between items-center mb-4 cursor-grab active:cursor-grabbing select-none"
      >
        {editingContainerId === container.id ? (
          <input
            type="text"
            autoFocus
            className="text-xl font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-none rounded px-2 py-1 flex-grow outline-none focus:ring-2 focus:ring-blue-500 w-full mr-16"
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
            className="text-xl font-bold text-gray-800 dark:text-gray-200 flex-grow cursor-text pr-16 select-none"
            onClick={(e) => {
              e.stopPropagation();
              if (container.id !== "1") {
                setEditingContainerId(container.id);
                setEditingContainerTitle(container.title);
              } else {
                onShowAlert(
                  "Aviso",
                  "A Barra de Favoritos padrão do navegador não pode ser renomeada."
                );
              }
            }}
            title={container.id !== "1" ? "Clique para renomear, arraste para mover" : "Arraste para mover"}
          >
            {container.title}
          </h2>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-70 sm:opacity-0 sm:group-hover/category:opacity-100 transition-all duration-200 z-10">
          {onArchiveContainer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchiveContainer(container.id);
              }}
              className="w-7 h-7 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 rounded-full flex items-center justify-center text-lg hover:!opacity-100 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
              title="Arquivar Pasta"
            >
              <div dangerouslySetInnerHTML={{ __html: svgs.archiveSVG }} className="w-4 h-4 flex items-center justify-center" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteContainer(container.id, container.title);
            }}
            className="w-7 h-7 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 rounded-full flex items-center justify-center text-lg hover:!opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors"
            title="Excluir Pasta"
          >
            <div dangerouslySetInnerHTML={{ __html: svgs.trashSVG }} className="w-4 h-4 flex items-center justify-center" />
          </button>
        </div>
      </div>

      <Droppable
        droppableId={container.id}
        direction={currentLayout === "grid" ? "horizontal" : "vertical"}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={
              currentLayout === "grid"
                ? "flex flex-wrap gap-2 min-h-[50px] flex-grow content-start"
                : "flex flex-col gap-1 min-h-[50px] flex-grow"
            }
          >
            {containerBookmarks.map((bookmark, index) => (
              <Draggable key={bookmark.id} draggableId={bookmark.id} index={index}>
                {(provided, snapshot) => (
                  <BookmarkItem
                    bookmark={bookmark}
                    layout={currentLayout}
                    onEdit={() => openEditBookmark(bookmark)}
                    onClickBookmark={onClickBookmark}
                    provided={provided}
                    snapshot={snapshot}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <button
              onClick={() => openAddBookmark(container.id)}
              className={`flex p-2 items-center rounded-xl hover:bg-gray-200/70 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-all duration-300
                ${currentLayout === "grid" ? "flex-col justify-center w-20" : "w-full"}
                ${containerBookmarks.length > 0 ? "opacity-0 group-hover/category:opacity-100" : "opacity-100"}`}
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
                    <div dangerouslySetInnerHTML={{ __html: svgs.addIconSVG }} />
                  </div>
                  <span className="mt-2 text-sm">Adicionar</span>
                </>
              )}
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
