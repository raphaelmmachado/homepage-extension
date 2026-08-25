import { ArchivedFolderCard } from "./ArchivedFolderCard";
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
  // Se a seção estiver vazia, não renderiza absolutamente nada dela
  if (archivedContainers.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-6 flex flex-wrap gap-2.5 items-start transition-all"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDropOnArchivedSection}
    >
      {archivedContainers.map((container) => (
        <ArchivedFolderCard
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
    </section>
  );
}
