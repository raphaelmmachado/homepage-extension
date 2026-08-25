import { useState } from "react";
import type { Container } from "../types";
import { STORAGE_KEYS } from "../types";

// The Chrome extension API is available at runtime
const chrome = globalThis.chrome;

type Props = {
  activeContainers: Container[];
  archivedContainers: Container[];
  setContainers: React.Dispatch<React.SetStateAction<Container[]>>;
  setArchivedContainerIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export function useContainerDnd({
  activeContainers,
  archivedContainers,
  setContainers,
  setArchivedContainerIds,
}: Props) {
  const [draggedContainer, setDraggedContainer] = useState<{
    id: string;
    isArchived: boolean;
  } | null>(null);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);

  const handleDragStart = (
    id: string,
    isArchived: boolean,
    e: React.DragEvent,
  ) => {
    setDraggedContainer({ id, isArchived });
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedContainer && dragOverContainerId !== id) {
      setDragOverContainerId(id);
    }
  };

  const handleDragLeave = (id: string, e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverContainerId === id) {
      setDragOverContainerId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedContainer(null);
    setDragOverContainerId(null);
  };

  const handleDropOnContainer = (
    targetId: string,
    targetIsArchived: boolean,
    e: React.DragEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedContainer || draggedContainer.id === targetId) {
      handleDragEnd();
      return;
    }

    const { id: sourceId, isArchived: sourceIsArchived } = draggedContainer;

    // Caso 1: Ativa -> Ativa (reordenação na grade 2D)
    if (!sourceIsArchived && !targetIsArchived) {
      const fromIndex = activeContainers.findIndex((c) => c.id === sourceId);
      const toIndex = activeContainers.findIndex((c) => c.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        const newActive = Array.from(activeContainers);
        const [moved] = newActive.splice(fromIndex, 1);
        if (moved) {
          newActive.splice(toIndex, 0, moved);
        }

        const newContainers = [...newActive, ...archivedContainers];
        setContainers(newContainers);
        localStorage.setItem(
          STORAGE_KEYS.CONTAINERS_ORDER,
          JSON.stringify(newContainers.map((c) => c.id)),
        );

        if (typeof chrome !== "undefined" && chrome.bookmarks && sourceId !== "1") {
          chrome.bookmarks.getChildren("1", (children) => {
            if (!children) return;
            const destNode = children.find((c) => c.id === targetId);
            if (destNode && destNode.index !== undefined) {
              chrome.bookmarks.move(sourceId, {
                parentId: "1",
                index: destNode.index,
              });
            }
          });
        }
      }
    }

    // Caso 2: Arquivada -> Arquivada
    else if (sourceIsArchived && targetIsArchived) {
      const fromIndex = archivedContainers.findIndex((c) => c.id === sourceId);
      const toIndex = archivedContainers.findIndex((c) => c.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        const newArchived = Array.from(archivedContainers);
        const [moved] = newArchived.splice(fromIndex, 1);
        if (moved) {
          newArchived.splice(toIndex, 0, moved);
        }

        const newIds = newArchived.map((c) => c.id);
        setArchivedContainerIds(newIds);
        localStorage.setItem(
          STORAGE_KEYS.ARCHIVED_CONTAINERS,
          JSON.stringify(newIds),
        );
      }
    }

    // Caso 3: Ativa -> Arquivada
    else if (!sourceIsArchived && targetIsArchived) {
      const toIndex = archivedContainers.findIndex((c) => c.id === targetId);
      setArchivedContainerIds((prev) => {
        const filtered = prev.filter((id) => id !== sourceId);
        filtered.splice(toIndex >= 0 ? toIndex : filtered.length, 0, sourceId);
        localStorage.setItem(
          STORAGE_KEYS.ARCHIVED_CONTAINERS,
          JSON.stringify(filtered),
        );
        return filtered;
      });
    }

    // Caso 4: Arquivada -> Ativa (desarquivar para a posição alvo)
    else if (sourceIsArchived && !targetIsArchived) {
      const movedContainer = archivedContainers.find((c) => c.id === sourceId);
      if (movedContainer) {
        setArchivedContainerIds((prev) => {
          const filtered = prev.filter((id) => id !== sourceId);
          localStorage.setItem(
            STORAGE_KEYS.ARCHIVED_CONTAINERS,
            JSON.stringify(filtered),
          );
          return filtered;
        });

        const toIndex = activeContainers.findIndex((c) => c.id === targetId);
        const newActive = Array.from(activeContainers);
        newActive.splice(toIndex >= 0 ? toIndex : newActive.length, 0, movedContainer);

        const newContainers = [
          ...newActive,
          ...archivedContainers.filter((c) => c.id !== sourceId),
        ];
        setContainers(newContainers);
        localStorage.setItem(
          STORAGE_KEYS.CONTAINERS_ORDER,
          JSON.stringify(newContainers.map((c) => c.id)),
        );
      }
    }

    handleDragEnd();
  };

  const handleDropOnArchivedSection = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedContainer || draggedContainer.isArchived) {
      handleDragEnd();
      return;
    }
    const sourceId = draggedContainer.id;
    setArchivedContainerIds((prev) => {
      if (prev.includes(sourceId)) return prev;
      const updated = [...prev, sourceId];
      localStorage.setItem(
        STORAGE_KEYS.ARCHIVED_CONTAINERS,
        JSON.stringify(updated),
      );
      return updated;
    });
    handleDragEnd();
  };

  const handleDropOnActiveBoard = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedContainer || !draggedContainer.isArchived) {
      handleDragEnd();
      return;
    }
    const sourceId = draggedContainer.id;
    const movedContainer = archivedContainers.find((c) => c.id === sourceId);
    if (movedContainer) {
      setArchivedContainerIds((prev) => {
        const filtered = prev.filter((id) => id !== sourceId);
        localStorage.setItem(
          STORAGE_KEYS.ARCHIVED_CONTAINERS,
          JSON.stringify(filtered),
        );
        return filtered;
      });

      const newContainers = [...activeContainers, movedContainer];
      setContainers(newContainers);
      localStorage.setItem(
        STORAGE_KEYS.CONTAINERS_ORDER,
        JSON.stringify(newContainers.map((c) => c.id)),
      );
    }
    handleDragEnd();
  };

  return {
    draggedContainer,
    dragOverContainerId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDragEnd,
    handleDropOnContainer,
    handleDropOnArchivedSection,
    handleDropOnActiveBoard,
  };
}
