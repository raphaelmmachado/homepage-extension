import { ArchivedContainerCard } from "./ArchivedContainerCard";
import type { Container, Bookmark } from "../types";

type Props = {
  archivedContainers: Container[];
  bookmarks: Bookmark[];
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
  onDragStart: (id: string, isArchived: boolean, e: React.DragEvent) => void;
  onDragOver: (id: string, e: React.DragEvent) => void;
  onDragLeave: (id: string, e: React.DragEvent) => void;
  onDropOnContainer: (
    targetId: string,
    targetIsArchived: boolean,
    e: React.DragEvent,
  ) => void;
  onDropOnArchivedSection: (e: React.DragEvent) => void;
  draggedContainer: { id: string; isArchived: boolean } | null;
  dragOverContainerId: string | null;
};

export function ArchivedSection({
  archivedContainers,
  bookmarks,
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
  onDropOnContainer,
  onDropOnArchivedSection,
  draggedContainer,
  dragOverContainerId,
}: Props) {
  // Se a seção estiver vazia, não renderiza nada dela conforme solicitado
  if (archivedContainers.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-8 mt-2"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDropOnArchivedSection}
    >
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 p-3 rounded-2xl border border-dashed transition-all duration-200 ${
          draggedContainer && !draggedContainer.isArchived
            ? "border-blue-400 bg-blue-50/20 dark:border-blue-500/50 dark:bg-blue-900/10"
            : "border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/20"
        }`}
      >
        {archivedContainers.map((container) => (
          <ArchivedContainerCard
            key={container.id}
            container={container}
            containerBookmarks={bookmarks.filter(
              (b) => b.containerId === container.id,
            )}
            editingContainerId={editingContainerId}
            editingContainerTitle={editingContainerTitle}
            setEditingContainerTitle={setEditingContainerTitle}
            setEditingContainerId={setEditingContainerId}
            saveContainerTitle={saveContainerTitle}
            deleteContainer={deleteContainer}
            unarchiveContainer={unarchiveContainer}
            openAddBookmark={openAddBookmark}
            openEditBookmark={openEditBookmark}
            onClickBookmark={onClickBookmark}
            onShowAlert={onShowAlert}
            onDragStart={(e) => onDragStart(container.id, true, e)}
            onDragOver={(e) => onDragOver(container.id, e)}
            onDragLeave={(e) => onDragLeave(container.id, e)}
            onDrop={(e) => onDropOnContainer(container.id, true, e)}
            isDragging={draggedContainer?.id === container.id}
            isDragOver={dragOverContainerId === container.id}
          />
        ))}
      </div>
    </section>
  );
}
