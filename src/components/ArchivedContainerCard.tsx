import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import type { Container, Bookmark } from "../types";
import * as svgs from "../svgs";

type Props = {
  container: Container;
  containerBookmarks: Bookmark[];
  editingContainerId: string | null;
  editingContainerTitle: string;
  setEditingContainerTitle: (title: string) => void;
  setEditingContainerId: (id: string | null) => void;
  saveContainerTitle: (id: string) => void;
  deleteContainer: (id: string, title: string) => void;
  unarchiveContainer: (id: string) => void;
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

export function ArchivedContainerCard({
  container,
  containerBookmarks,
  editingContainerId,
  editingContainerTitle,
  setEditingContainerTitle,
  setEditingContainerId,
  saveContainerTitle,
  deleteContainer,
  unarchiveContainer,
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/70 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group/archived-card ${
        isDragging ? "opacity-30 scale-[0.98] border-dashed border-2 border-blue-400 dark:border-blue-500 shadow-xl" : ""
      } ${
        isDragOver ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 border-blue-500 scale-[1.02] shadow-xl" : ""
      }`}
    >
      {/* Cabeçalho minimizado da pasta arquivada */}
      <div
        draggable={true}
        onDragStart={onDragStart}
        className="px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing bg-gray-50/50 dark:bg-gray-800/80 select-none"
      >
        <div
          className="flex items-center gap-2 flex-grow min-w-0 cursor-pointer"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {/* Botão V (Chevron) para abrir/fechar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-200"
            title={isOpen ? "Recolher pasta" : "Expandir pasta"}
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgs.chevronDownSVG }}
              className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {/* Título da pasta apenas em texto */}
          {editingContainerId === container.id ? (
            <input
              type="text"
              autoFocus
              className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-none rounded px-2 py-0.5 flex-grow outline-none focus:ring-2 focus:ring-blue-500"
              value={editingContainerTitle}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditingContainerTitle(e.target.value)}
              onBlur={() => saveContainerTitle(container.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveContainerTitle(container.id);
                if (e.key === "Escape") setEditingContainerId(null);
              }}
            />
          ) : (
            <span
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
              title={container.id !== "1" ? "Clique para renomear" : container.title}
            >
              {container.title}
            </span>
          )}

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-400 shrink-0">
            {containerBookmarks.length}
          </span>
        </div>

        {/* Botões de Ação: Desarquivar e Excluir */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unarchiveContainer(container.id);
            }}
            className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md flex items-center justify-center transition-colors cursor-pointer"
            title="Desarquivar Pasta"
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgs.archiveRestoreSVG }}
              className="w-3.5 h-3.5 flex items-center justify-center"
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteContainer(container.id, container.title);
            }}
            className="w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md flex items-center justify-center transition-colors cursor-pointer"
            title="Excluir Pasta"
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgs.trashSVG }}
              className="w-3.5 h-3.5 flex items-center justify-center"
            />
          </button>
        </div>
      </div>

      {/* Conteúdo exibido apenas quando expandido (texto puro dos favoritos) */}
      {isOpen && (
        <Droppable droppableId={container.id} direction="vertical">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="p-3 border-t border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/90 flex flex-col gap-1 text-xs"
            >
              {containerBookmarks.length === 0 ? (
                <span className="text-gray-400 dark:text-gray-500 italic py-1">
                  Nenhum favorito nesta pasta.
                </span>
              ) : (
                containerBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between group/archived-item py-1 px-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <a
                      href={bookmark.url}
                      onClick={() => onClickBookmark(bookmark.id)}
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          onClickBookmark(bookmark.id);
                          window.open(bookmark.url, "_blank");
                        }
                      }}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate flex-grow mr-2"
                      title={bookmark.description || bookmark.url}
                    >
                      {bookmark.name || bookmark.title || bookmark.url}
                    </a>
                    <button
                      type="button"
                      onClick={() => openEditBookmark(bookmark)}
                      className="opacity-0 group-hover/archived-item:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity p-0.5"
                      title="Editar Favorito"
                    >
                      <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
                    </button>
                  </div>
                ))
              )}
              {provided.placeholder}
              <button
                type="button"
                onClick={() => openAddBookmark(container.id)}
                className="mt-1 flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 py-1 px-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: svgs.addIconSVG }}
                  className="w-3.5 h-3.5"
                />
                <span>Adicionar Favorito</span>
              </button>
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}
