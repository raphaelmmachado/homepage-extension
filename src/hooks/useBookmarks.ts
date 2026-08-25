import { useState, useEffect, useCallback } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import type { Bookmark, Container } from "../types";
import { BookmarkRepo } from "../services/BookmarkRepo";
import { BookmarkJsonCodec } from "../services/BookmarkJsonCodec";
import type { DialogConfig } from "../components/CustomDialog";

export function useBookmarks(
  showDialog: (
    options: Omit<DialogConfig, "isOpen" | "onConfirm" | "onCancel">,
  ) => Promise<string | boolean | null>
) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [archivedContainerIds, setArchivedContainerIds] = useState<string[]>([]);
  
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(null);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingContainerTitle, setEditingContainerTitle] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await BookmarkRepo.loadTree();
      setContainers(data.containers);
      setBookmarks(data.bookmarks);
      setArchivedContainerIds(data.archivedContainerIds);
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    const chrome = globalThis.chrome;
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      const handleChanged = () => loadData();
      chrome.bookmarks.onCreated.addListener(handleChanged);
      chrome.bookmarks.onRemoved.addListener(handleChanged);
      chrome.bookmarks.onChanged.addListener(handleChanged);
      chrome.bookmarks.onMoved.addListener(handleChanged);
      chrome.bookmarks.onChildrenReordered.addListener(handleChanged);
      return () => {
        chrome.bookmarks.onCreated.removeListener(handleChanged);
        chrome.bookmarks.onRemoved.removeListener(handleChanged);
        chrome.bookmarks.onChanged.removeListener(handleChanged);
        chrome.bookmarks.onMoved.removeListener(handleChanged);
        chrome.bookmarks.onChildrenReordered.removeListener(handleChanged);
      };
    }
  }, [loadData]);

  const activeContainers = containers.filter(c => !archivedContainerIds.includes(c.id));
  const archivedContainers = containers.filter(c => archivedContainerIds.includes(c.id));

  const addContainer = async () => {
    const title = await showDialog({ type: "prompt", title: "Nova Pasta", message: "Nome da Pasta:" });
    if (typeof title === "string" && title.trim()) {
      await BookmarkRepo.createContainer(title.trim());
      loadData();
    }
  };

  const deleteContainer = async (id: string, title: string) => {
    const confirmDelete = await showDialog({
      type: "confirm",
      title: "Excluir Pasta",
      message: `Tem certeza que deseja remover a pasta "${title}" e todos os seus favoritos?\n\nISSO APAGARÁ DO SEU NAVEGADOR!`,
    });
    if (confirmDelete) {
      await BookmarkRepo.deleteContainer(id);
      loadData();
    }
  };

  const saveContainerTitle = async (id: string) => {
    if (!editingContainerId) return;
    const newTitle = editingContainerTitle.trim();
    if (newTitle) {
      await BookmarkRepo.updateContainerTitle(id, newTitle);
      loadData();
    }
    setEditingContainerId(null);
  };

  const archiveContainer = (id: string) => {
    BookmarkRepo.archiveContainer(id);
    setArchivedContainerIds(prev => [...prev, id]);
  };

  const unarchiveContainer = (id: string) => {
    BookmarkRepo.unarchiveContainer(id);
    setArchivedContainerIds(prev => prev.filter(i => i !== id));
  };

  const openAddBookmark = (containerId: string) => {
    setEditingBookmark(null);
    setActiveContainerId(containerId);
    setIsBookmarkDialogOpen(true);
  };

  const openEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setActiveContainerId(bookmark.containerId);
    setIsBookmarkDialogOpen(true);
  };

  const saveBookmark = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string)?.trim() || "";
    const url = (formData.get("url") as string)?.trim() || "";
    const customIcon = (formData.get("customIcon") as string)?.trim() || "";
    const description = (formData.get("description") as string)?.trim() || "";

    if (editingBookmark) {
      await BookmarkRepo.updateBookmark(editingBookmark.id, editingBookmark.url || "", { title, url, customIcon: customIcon || undefined, description: description || undefined });
    } else if (activeContainerId) {
      await BookmarkRepo.createBookmark({ parentId: activeContainerId, title, url, customIcon: customIcon || undefined, description: description || undefined });
    }
    setIsBookmarkDialogOpen(false);
    loadData();
  };

  const deleteBookmark = async () => {
    if (editingBookmark) {
      await BookmarkRepo.deleteBookmark(editingBookmark.id);
      setIsBookmarkDialogOpen(false);
      loadData();
    }
  };

  const handleBookmarkClick = (url: string) => {
    BookmarkRepo.incrementClicks(url);
  };

  const handleExport = () => {
    BookmarkJsonCodec.exportData(bookmarks, containers, archivedContainerIds);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = await BookmarkJsonCodec.importData(file, showDialog as any);
    if (success) {
      await showDialog({ type: "alert", title: "Sucesso", message: "Favoritos importados com sucesso!" });
      loadData();
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    if (type === "CONTAINER") {
      // Reordering handled by useContainerDnd in App.tsx (HTML5 drag/drop usually, or beautiful dnd if so)
      // Actually we just call loadData? Wait, original useBookmarks did reordering manually for local state.
      // BookmarkRepo sync handles chrome sync, but we don't have moveContainer in chrome.bookmarks API (they are just folders under "1").
      // Actually chrome.bookmarks does support moving!
      if (!archivedContainerIds.includes(draggableId)) {
        await BookmarkRepo.moveBookmark(draggableId, "1", destination.index);
        loadData();
      }
    } else {
      await BookmarkRepo.moveBookmark(draggableId, destination.droppableId, destination.index);
      loadData();
    }
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
