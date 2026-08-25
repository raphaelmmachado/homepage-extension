import { useState, useEffect } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import type { Bookmark, Container } from "../types";
import { STORAGE_KEYS } from "../types";
import type { DialogConfig } from "../components/CustomDialog";

const chrome = globalThis.chrome;


export function useBookmarks(
  showDialog: (
    options: Omit<DialogConfig, "isOpen" | "onConfirm" | "onCancel">,
  ) => Promise<string | boolean | null>
) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(
    null,
  );
  const [editingContainerTitle, setEditingContainerTitle] = useState("");
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(
    null,
  );
  const [archivedContainerIds, setArchivedContainerIds] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.ARCHIVED_CONTAINERS);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.ARCHIVED_CONTAINERS,
      JSON.stringify(archivedContainerIds),
    );
  }, [archivedContainerIds]);

  const activeContainers = containers.filter(
    (c) => !archivedContainerIds.includes(c.id),
  );
  const archivedContainers = archivedContainerIds
    .map((id) => containers.find((c) => c.id === id))
    .filter((c): c is Container => Boolean(c));

  const archiveContainer = (id: string) => {
    setArchivedContainerIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const unarchiveContainer = (id: string) => {
    setArchivedContainerIds((prev) => prev.filter((item) => item !== id));
  };



  const loadBookmarks = async () => {
    if (typeof chrome === "undefined" || !chrome.bookmarks) return;

    const tree = await chrome.bookmarks.getTree();

    const bookmarksBar =
      tree[0]?.children?.find((node: chrome.bookmarks.BookmarkTreeNode) => node.id === "1") ||
      tree[0]?.children?.[0];
    if (!bookmarksBar || !bookmarksBar.children) return;

    const newContainers: Container[] = [];
    const newBookmarks: Bookmark[] = [];

    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};

    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    const savedDescriptionsRaw = localStorage.getItem(
      STORAGE_KEYS.DESCRIPTIONS,
    );
    const savedDescriptions = savedDescriptionsRaw
      ? JSON.parse(savedDescriptionsRaw)
      : {};

    const defaultContainerId = "1";
    let hasLooseBookmarks = false;

    for (const node of bookmarksBar.children) {
      if (node.url) {
        hasLooseBookmarks = true;
        newBookmarks.push({
          id: node.id,
          containerId: defaultContainerId,
          title: node.title,
          name: node.title,
          url: node.url,
          clicks: savedClicks[node.url] || 0,
          customIcon: savedIcons[node.url] || savedIcons[node.id] || undefined,
          description:
            savedDescriptions[node.url] ||
            savedDescriptions[node.id] ||
            undefined,
        });
      } else {
        newContainers.push({
          id: node.id,
          title: node.title,
        });

        if (node.children) {
          for (const child of node.children) {
            if (child.url) {
              newBookmarks.push({
                id: child.id,
                containerId: node.id,
                title: child.title,
                name: child.title,
                url: child.url,
                clicks: savedClicks[child.url] || 0,
                customIcon:
                  savedIcons[child.url] || savedIcons[child.id] || undefined,
                description:
                  savedDescriptions[child.url] ||
                  savedDescriptions[child.id] ||
                  undefined,
              });
            }
          }
        }
      }
    }

    if (hasLooseBookmarks) {
      newContainers.unshift({
        id: defaultContainerId,
        title: "Barra de Favoritos",
      });
    }

    const savedOrderRaw = localStorage.getItem(STORAGE_KEYS.CONTAINERS_ORDER);
    if (savedOrderRaw) {
      try {
        const savedOrder: string[] = JSON.parse(savedOrderRaw);
        if (Array.isArray(savedOrder) && savedOrder.length > 0) {
          newContainers.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
          });
        }
      } catch {
        // ignore JSON parse error
      }
    }

    setContainers(newContainers);
    setBookmarks(newBookmarks);
  };

  useEffect(() => {
    loadBookmarks();

    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(loadBookmarks);
      chrome.bookmarks.onRemoved.addListener(loadBookmarks);
      chrome.bookmarks.onChanged.addListener(loadBookmarks);
      chrome.bookmarks.onMoved.addListener(loadBookmarks);
      chrome.bookmarks.onChildrenReordered.addListener(loadBookmarks);

      return () => {
        chrome.bookmarks.onCreated.removeListener(loadBookmarks);
        chrome.bookmarks.onRemoved.removeListener(loadBookmarks);
        chrome.bookmarks.onChanged.removeListener(loadBookmarks);
        chrome.bookmarks.onMoved.removeListener(loadBookmarks);
        chrome.bookmarks.onChildrenReordered.removeListener(loadBookmarks);
      };
    }
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    if (type === "CONTAINER") {
      const isSourceArchived = source.droppableId === "archived-containers-board";
      const isDestArchived = destination.droppableId === "archived-containers-board";

      if (!isSourceArchived && !isDestArchived) {
        // Reordenar dentro das pastas ativas
        const newActive = Array.from(activeContainers);
        const [moved] = newActive.splice(source.index, 1);
        if (moved) {
          newActive.splice(destination.index, 0, moved);
        }

        const newContainers = [...newActive, ...archivedContainers];
        setContainers(newContainers);
        localStorage.setItem(
          STORAGE_KEYS.CONTAINERS_ORDER,
          JSON.stringify(newContainers.map((c) => c.id)),
        );

        if (typeof chrome !== "undefined" && chrome.bookmarks && draggableId !== "1") {
          chrome.bookmarks.getChildren("1", (children: chrome.bookmarks.BookmarkTreeNode[]) => {
            if (!children) return;
            const folders = children.filter((c: chrome.bookmarks.BookmarkTreeNode) => !c.url);
            const targetActive = newActive[destination.index];
            const targetFolder = folders.find((f) => f.id === targetActive?.id);
            if (targetFolder && targetFolder.index !== undefined) {
              chrome.bookmarks.move(draggableId, {
                parentId: "1",
                index: targetFolder.index,
              });
            }
          });
        }
      } else if (isSourceArchived && isDestArchived) {
        // Reordenar dentro das pastas arquivadas
        const newArchived = Array.from(archivedContainers);
        const [moved] = newArchived.splice(source.index, 1);
        if (moved) {
          newArchived.splice(destination.index, 0, moved);
        }
        const newIds = newArchived.map((c) => c.id);
        setArchivedContainerIds(newIds);
        localStorage.setItem(STORAGE_KEYS.ARCHIVED_CONTAINERS, JSON.stringify(newIds));
      } else if (!isSourceArchived && isDestArchived) {
        // Mover de ativa para arquivada
        const movedContainer = activeContainers[source.index];
        if (movedContainer) {
          setArchivedContainerIds((prev) => {
            const newIds = prev.filter((id) => id !== movedContainer.id);
            newIds.splice(destination.index, 0, movedContainer.id);
            return newIds;
          });
        }
      } else if (isSourceArchived && !isDestArchived) {
        // Mover de arquivada para ativa (desarquivar)
        const movedContainer = archivedContainers[source.index];
        if (movedContainer) {
          setArchivedContainerIds((prev) => prev.filter((id) => id !== movedContainer.id));
          const newActive = Array.from(activeContainers);
          newActive.splice(destination.index, 0, movedContainer);
          const newContainers = [
            ...newActive,
            ...archivedContainers.filter((c) => c.id !== movedContainer.id),
          ];
          setContainers(newContainers);
          localStorage.setItem(
            STORAGE_KEYS.CONTAINERS_ORDER,
            JSON.stringify(newContainers.map((c) => c.id)),
          );
        }
      }
      return;
    }

    if (
      source.droppableId === "top-sites" ||
      destination.droppableId === "top-sites"
    ) {
      return;
    }

    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      chrome.bookmarks.move(draggableId, {
        parentId: destination.droppableId,
        index: destination.index,
      });
    } else {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === draggableId ? { ...b, containerId: destination.droppableId } : b,
        ),
      );
    }
  };

  const handleBookmarkClick = (id: string) => {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark || !bookmark.url) return;

    const url = bookmark.url;
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};
    savedClicks[url] = (savedClicks[url] || 0) + 1;
    localStorage.setItem(
      STORAGE_KEYS.BOOKMARK_CLICKS,
      JSON.stringify(savedClicks),
    );

    setBookmarks((prev) =>
      prev.map((b) => (b.url === url ? { ...b, clicks: savedClicks[url] } : b)),
    );
  };

  const handleExport = () => {
    const savedClicksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedClicks = savedClicksRaw ? JSON.parse(savedClicksRaw) : {};

    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    const savedDescriptionsRaw = localStorage.getItem(
      STORAGE_KEYS.DESCRIPTIONS,
    );
    const savedDescriptions = savedDescriptionsRaw
      ? JSON.parse(savedDescriptionsRaw)
      : {};

    const exportBookmarks = bookmarks.map((b) => ({
      ...b,
      clicks: savedClicks[b.url] || b.clicks || 0,
      customIcon: savedIcons[b.url] || savedIcons[b.id] || b.customIcon,
      description:
        savedDescriptions[b.url] || savedDescriptions[b.id] || b.description,
    }));

    const data = {
      containers,
      bookmarks: exportBookmarks,
      clicks: savedClicks,
      customIcons: savedIcons,
      descriptions: savedDescriptions,
      archivedContainers: archivedContainerIds,
      exportDate: new Date().toISOString(),
      version: 2,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homepage-bookmarks-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      await showDialog({
        type: "alert",
        title: "Aviso",
        message:
          "A importação direta requer que a extensão esteja rodando no navegador.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data || (!data.containers && !data.bookmarks)) {
          await showDialog({
            type: "alert",
            title: "Aviso",
            message: "Arquivo JSON inválido ou sem favoritos.",
          });
          return;
        }

        const confirmImport = await showDialog({
          type: "confirm",
          title: "Importar Favoritos",
          message:
            "Deseja importar estes favoritos para o seu navegador?\n\nIsso criará as pastas e links diretamente na sua Barra de Favoritos.",
        });
        if (!confirmImport) return;

        if (
          data.clicks ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: Bookmark) => b.clicks))
        ) {
          const currentClicksRaw = localStorage.getItem(
            STORAGE_KEYS.BOOKMARK_CLICKS,
          );
          const currentClicks = currentClicksRaw
            ? JSON.parse(currentClicksRaw)
            : {};

          if (data.clicks) {
            Object.assign(currentClicks, data.clicks);
          }
          if (Array.isArray(data.bookmarks)) {
            data.bookmarks.forEach((b: Bookmark) => {
              if (b.url && b.clicks) {
                currentClicks[b.url] = Math.max(
                  currentClicks[b.url] || 0,
                  b.clicks,
                );
              }
            });
          }
          localStorage.setItem(
            STORAGE_KEYS.BOOKMARK_CLICKS,
            JSON.stringify(currentClicks),
          );
        }

        if (
          data.customIcons ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: Bookmark) => b.customIcon))
        ) {
          const currentIconsRaw = localStorage.getItem(
            STORAGE_KEYS.CUSTOM_ICONS,
          );
          const currentIcons = currentIconsRaw
            ? JSON.parse(currentIconsRaw)
            : {};

          if (data.customIcons) {
            Object.assign(currentIcons, data.customIcons);
          }
          if (Array.isArray(data.bookmarks)) {
            data.bookmarks.forEach((b: Bookmark) => {
              if (b.url && b.customIcon) {
                currentIcons[b.url] = b.customIcon;
              }
            });
          }
          localStorage.setItem(
            STORAGE_KEYS.CUSTOM_ICONS,
            JSON.stringify(currentIcons),
          );
        }

        if (
          data.descriptions ||
          (Array.isArray(data.bookmarks) &&
            data.bookmarks.some((b: Bookmark) => b.description))
        ) {
          const currentDescriptionsRaw = localStorage.getItem(
            STORAGE_KEYS.DESCRIPTIONS,
          );
          const currentDescriptions = currentDescriptionsRaw
            ? JSON.parse(currentDescriptionsRaw)
            : {};

          if (data.descriptions) {
            Object.assign(currentDescriptions, data.descriptions);
          }
          if (Array.isArray(data.bookmarks)) {
            data.bookmarks.forEach((b: Bookmark) => {
              if (b.url && b.description) {
                currentDescriptions[b.url] = b.description;
              }
            });
          }
          localStorage.setItem(
            STORAGE_KEYS.DESCRIPTIONS,
            JSON.stringify(currentDescriptions),
          );
        }

        const containerMap = new Map<string, string>();

        const tree = await chrome.bookmarks.getTree();
        const bookmarksBar =
          tree[0]?.children?.find((node: chrome.bookmarks.BookmarkTreeNode) => node.id === "1") ||
          tree[0]?.children?.[0];
        const existingFolders = new Map<string, string>();
        if (bookmarksBar?.children) {
          for (const child of bookmarksBar.children) {
            if (!child.url && child.title) {
              existingFolders.set(child.title.toLowerCase().trim(), child.id);
            }
          }
        }

        if (Array.isArray(data.containers)) {
          for (const container of data.containers) {
            if (
              !container.title ||
              container.id === "1" ||
              container.id === "default-container-1" ||
              container.title === "Barra de Favoritos"
            ) {
              containerMap.set(container.id, "1");
              continue;
            }

            const existingId = existingFolders.get(
              container.title.toLowerCase().trim(),
            );
            if (existingId) {
              containerMap.set(container.id, existingId);
            } else {
              const newFolder = await chrome.bookmarks.create({
                parentId: "1",
                title: container.title,
              });
              containerMap.set(container.id, newFolder.id);
              existingFolders.set(
                container.title.toLowerCase().trim(),
                newFolder.id,
              );
            }
          }
        }

        if (Array.isArray(data.bookmarks)) {
          for (const b of data.bookmarks) {
            if (!b.url) continue;

            const targetParentId = b.containerId
              ? containerMap.get(b.containerId) || "1"
              : "1";
            const title = b.name || b.title || b.url;

            await chrome.bookmarks.create({
              parentId: targetParentId,
              title: title,
              url: b.url,
            });
          }
        }

        if (data.archivedContainers && Array.isArray(data.archivedContainers)) {
          const importedArchived = data.archivedContainers
            .map((oldId: string) => containerMap.get(oldId) || oldId)
            .filter((id: string) => Boolean(id));
          setArchivedContainerIds((prev) =>
            Array.from(new Set([...prev, ...importedArchived])),
          );
        }

        await loadBookmarks();
        await showDialog({
          type: "alert",
          title: "Sucesso",
          message:
            "Favoritos importados e sincronizados com o navegador com sucesso! 🎉",
        });
      } catch (err) {
        console.error("Erro na importação:", err);
        await showDialog({
          type: "alert",
          title: "Erro",
          message: "Erro ao importar o arquivo de backup.",
        });
      } finally {
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const openAddBookmark = (containerId: string) => {
    setEditingBookmark(null);
    setActiveContainerId(containerId);
    setIsBookmarkDialogOpen(true);
  };

  const openEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsBookmarkDialogOpen(true);
  };

  const saveBookmark = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("name") as string)?.trim() || "";
    const url = (formData.get("url") as string)?.trim() || "";
    const customIcon = (formData.get("customIcon") as string)?.trim() || "";

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      await showDialog({
        type: "alert",
        title: "Aviso",
        message:
          "A integração de favoritos requer que o app rode como extensão do Chrome/Brave.",
      });
      setIsBookmarkDialogOpen(false);
      return;
    }

    const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
    const savedIcons = savedIconsRaw ? JSON.parse(savedIconsRaw) : {};

    const savedDescriptionsRaw = localStorage.getItem(
      STORAGE_KEYS.DESCRIPTIONS,
    );
    const savedDescriptions = savedDescriptionsRaw
      ? JSON.parse(savedDescriptionsRaw)
      : {};

    const description = (formData.get("description") as string)?.trim() || "";

    if (editingBookmark) {
      if (customIcon) {
        savedIcons[url] = customIcon;
        if (editingBookmark.url && editingBookmark.url !== url) {
          delete savedIcons[editingBookmark.url];
        }
      } else {
        delete savedIcons[url];
        if (editingBookmark.url) {
          delete savedIcons[editingBookmark.url];
        }
      }
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_ICONS,
        JSON.stringify(savedIcons),
      );

      if (description) {
        savedDescriptions[url] = description;
        if (editingBookmark.url && editingBookmark.url !== url) {
          delete savedDescriptions[editingBookmark.url];
        }
      } else {
        delete savedDescriptions[url];
        if (editingBookmark.url) {
          delete savedDescriptions[editingBookmark.url];
        }
      }
      localStorage.setItem(
        STORAGE_KEYS.DESCRIPTIONS,
        JSON.stringify(savedDescriptions),
      );

      await chrome.bookmarks.update(editingBookmark.id, { title, url });
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === editingBookmark.id
            ? {
                ...b,
                name: title,
                title,
                url,
                customIcon: customIcon || undefined,
                description: description || undefined,
              }
            : b,
        ),
      );
    } else if (activeContainerId) {
      if (customIcon) {
        savedIcons[url] = customIcon;
        localStorage.setItem(
          STORAGE_KEYS.CUSTOM_ICONS,
          JSON.stringify(savedIcons),
        );
      }
      if (description) {
        savedDescriptions[url] = description;
        localStorage.setItem(
          STORAGE_KEYS.DESCRIPTIONS,
          JSON.stringify(savedDescriptions),
        );
      }
      await chrome.bookmarks.create({
        parentId: activeContainerId,
        title,
        url,
      });
    }
    setIsBookmarkDialogOpen(false);
  };

  const deleteBookmark = () => {
    if (editingBookmark) {
      if (editingBookmark.url) {
        const savedIconsRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ICONS);
        if (savedIconsRaw) {
          const savedIcons = JSON.parse(savedIconsRaw);
          delete savedIcons[editingBookmark.url];
          delete savedIcons[editingBookmark.id];
          localStorage.setItem(
            STORAGE_KEYS.CUSTOM_ICONS,
            JSON.stringify(savedIcons),
          );
        }

        const savedDescriptionsRaw = localStorage.getItem(
          STORAGE_KEYS.DESCRIPTIONS,
        );
        if (savedDescriptionsRaw) {
          const savedDescriptions = JSON.parse(savedDescriptionsRaw);
          delete savedDescriptions[editingBookmark.url];
          delete savedDescriptions[editingBookmark.id];
          localStorage.setItem(
            STORAGE_KEYS.DESCRIPTIONS,
            JSON.stringify(savedDescriptions),
          );
        }
      }
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        chrome.bookmarks.remove(editingBookmark.id);
      }
      setIsBookmarkDialogOpen(false);
    }
  };

  const addContainer = async () => {
    const title = await showDialog({
      type: "prompt",
      title: "Nova Pasta",
      message: "Nome da Pasta:",
    });
    if (typeof title === "string" && title.trim()) {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        await chrome.bookmarks.create({ parentId: "1", title: title.trim() });
        await loadBookmarks();
      } else {
        const newId = crypto.randomUUID();
        setContainers((prev) => [...prev, { id: newId, title: title.trim() }]);
      }
    }
  };

  const deleteContainer = async (id: string, title: string) => {
    if (id === "1") {
      const confirmClear = await showDialog({
        type: "confirm",
        title: "Limpar Favoritos",
        message: `Deseja remover todos os favoritos soltos da "${title}"?\n\nISSO APAGARÁ DO SEU NAVEGADOR!`,
      });
      if (confirmClear) {
        if (typeof chrome !== "undefined" && chrome.bookmarks) {
          const loose = bookmarks.filter((b) => b.containerId === "1");
          for (const b of loose) {
            try {
              await chrome.bookmarks.remove(b.id);
            } catch (err) {
              console.error("Erro ao remover favorito:", err);
            }
          }
          await loadBookmarks();
        }
        setBookmarks((prev) => prev.filter((b) => b.containerId !== "1"));
        setContainers((prev) => prev.filter((c) => c.id !== "1"));
      }
      return;
    }

    const confirmDelete = await showDialog({
      type: "confirm",
      title: "Excluir Pasta",
      message: `Tem certeza que deseja remover a pasta "${title}" e todos os seus favoritos?\n\nISSO APAGARÁ DO SEU NAVEGADOR!`,
    });
    if (confirmDelete) {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        try {
          await chrome.bookmarks.removeTree(id);
          await loadBookmarks();
        } catch (err) {
          console.error("Erro ao remover pasta de favoritos:", err);
          await showDialog({
            type: "alert",
            title: "Erro",
            message: "Não foi possível excluir a pasta no navegador.",
          });
        }
      }
      setContainers((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        localStorage.setItem(
          STORAGE_KEYS.CONTAINERS_ORDER,
          JSON.stringify(updated.map((c) => c.id)),
        );
        return updated;
      });
      setBookmarks((prev) => prev.filter((b) => b.containerId !== id));
      setArchivedContainerIds((prev) => prev.filter((cId) => cId !== id));
    }
  };

  const saveContainerTitle = async (id: string) => {
    if (!editingContainerId) return;
    const newTitle = editingContainerTitle.trim();
    if (newTitle && newTitle !== containers.find((c) => c.id === id)?.title) {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        try {
          await chrome.bookmarks.update(id, { title: newTitle });
          await loadBookmarks();
        } catch (err) {
          console.error("Erro ao renomear pasta:", err);
        }
      }
      setContainers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      );
    }
    setEditingContainerId(null);
  };

  return {
    containers,
    setContainers,
    activeContainers,
    archivedContainers,
    archivedContainerIds,
    setArchivedContainerIds,
    archiveContainer,
    unarchiveContainer,
    bookmarks,
    isBookmarkDialogOpen,
    setIsBookmarkDialogOpen,
    editingBookmark,
    setEditingBookmark,
    editingContainerId,
    setEditingContainerId,
    editingContainerTitle,
    setEditingContainerTitle,
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
  };
}

