import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Container, Bookmark, Layout } from "../types";
import { BookmarkItem } from "./BookmarkItem";
import * as svgs from "../svgs";

type Props = {
  container: Container;
  containerBookmarks: Bookmark[];
  currentLayout: Layout;
  editingContainerId: string | null;
  editingContainerTitle: string;
  setEditingContainerTitle: (title: string) => void;
  setEditingContainerId: (id: string | null) => void;
  saveContainerTitle: (id: string) => void;
  deleteContainer: (id: string, title: string) => void;
  openAddBookmark: (containerId: string) => void;
  openEditBookmark: (bookmark: Bookmark) => void;
  onClickBookmark: (id: string) => void;
  onShowAlert: (title: string, message: string) => void;
};

export function ContainerCard({
  container,
  containerBookmarks,
  currentLayout,
  editingContainerId,
  editingContainerTitle,
  setEditingContainerTitle,
  setEditingContainerId,
  saveContainerTitle,
  deleteContainer,
  openAddBookmark,
  openEditBookmark,
  onClickBookmark,
  onShowAlert,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative group/category transition-all">
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
                onShowAlert(
                  "Aviso",
                  "A Barra de Favoritos padrão do navegador não pode ser renomeada."
                );
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
                ? "flex flex-wrap gap-2 min-h-[50px]"
                : "flex flex-col gap-1 min-h-[50px]"
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
              className={`flex p-2 items-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-all duration-300
                ${currentLayout === "grid" ? "flex-col justify-center w-20" : "w-full"}
                ${containerBookmarks.length > 0 ? "opacity-0 group-hover/category:opacity-100" : "opacity-100"}`}
            >
              {currentLayout === "list" ? (
                <>
                  <span
                    className="mr-2"
                    dangerouslySetInnerHTML={{
                      __html: svgs.addIconSVG,
                    }}
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
  );
}
