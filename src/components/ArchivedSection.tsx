import { ContainerCardView } from "./ContainerCardView";
import type { Container, Bookmark, Layout } from "../types";

type Props = {
  archivedContainers: Container[];
  bookmarks: Bookmark[];
  currentLayout?: Layout;
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
  currentLayout = "grid",
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
      className="mb-8"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDropOnArchivedSection}
    >
      <div
        className={`grid ${
          currentLayout === "grid"
            ? "lg:grid-cols-3 md:grid-cols-2 grid-cols-1"
            : "lg:grid-cols-4 md:grid-cols-3 grid-cols-2"
        } gap-6`}
      >
        {archivedContainers.map((container) => (
          <div key={container.id} className="h-full flex flex-col">
            <ContainerCardView
              isArchived={true}
              defaultCollapsed={true}
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
              onUnarchiveContainer={unarchiveContainer}
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
          </div>
        ))}
      </div>
    </section>
  );
}
