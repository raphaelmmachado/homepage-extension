import { useState } from "react";
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

export function ArchivedFolderCard({
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
      className={`relative group bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/50 shadow-xs hover:shadow-sm transition-all duration-200 ${
        isDragging ? "opacity-30 scale-95" : ""
      } ${
        isDragOver
          ? "ring-2 ring-blue-500 scale-105 border-blue-500 shadow-md"
          : ""
      }`}
    >
      {/* Barra minimizada da pasta */}
      <div
        draggable={true}
        onDragStart={onDragStart}
        className="flex items-center gap-2 px-3 py-1.5 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Botão V para abrir/fechar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
          title={isOpen ? "Recolher favoritos" : "Mostrar favoritos"}
        >
          <div
            dangerouslySetInnerHTML={{ __html: svgs.chevronDownSVG }}
            className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {/* Título da pasta (apenas texto) */}
        {editingContainerId === container.id ? (
          <input
            type="text"
            autoFocus
            className="text-base font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border-none rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-500 w-28"
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
            onClick={() => setIsOpen((prev) => !prev)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (container.id !== "1") {
                setEditingContainerId(container.id);
                setEditingContainerTitle(container.title);
              } else {
                onShowAlert(
                  "Aviso",
                  "A Barra de Favoritos padrão do navegador não pode ser renomeada.",
                );
              }
            }}
            className="text-base font-medium text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors max-w-[160px]"
            title={`${container.title} (clique para abrir, duplo-clique para renomear)`}
          >
            {container.title}
          </span>
        )}

        {/* Quantidade discreta de favoritos */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          ({containerBookmarks.length})
        </span>

        {/* Ações discretas no hover: Desarquivar e Excluir */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              unarchiveContainer(container.id);
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
            title="Desarquivar pasta (retornar ao painel principal)"
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgs.archiveRestoreSVG }}
              className="w-3.5 h-3.5"
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteContainer(container.id, container.title);
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
            title="Excluir pasta"
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgs.trashSVG }}
              className="w-3.5 h-3.5"
            />
          </button>
        </div>
      </div>

      {/* Conteúdo exibido apenas quando expandido (links de texto) */}
      {isOpen && (
        <div className="px-2.5 pb-2 pt-1 border-t border-gray-100 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 flex flex-col gap-1 min-w-[200px] max-h-64 overflow-y-auto rounded-b-xl">
          {containerBookmarks.length === 0 ? (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 italic px-2 py-1">
              Nenhum favorito nesta pasta.
            </span>
          ) : (
            containerBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group/item"
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
                  className="text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate flex-grow mr-2"
                  title={bookmark.description || bookmark.url}
                >
                  {bookmark.name || bookmark.title || bookmark.url}
                </a>
                <button
                  type="button"
                  onClick={() => openEditBookmark(bookmark)}
                  className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-blue-600 p-0.5 transition-opacity"
                  title="Editar favorito"
                >
                  <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={() => openAddBookmark(container.id)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded transition-colors cursor-pointer mt-0.5"
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgs.addIconSVG }}
              className="w-3 h-3"
            />
            <span>Adicionar</span>
          </button>
        </div>
      )}
    </div>
  );
}
