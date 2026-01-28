// --- ESTADO E CHAVES DO LOCALSTORAGE ---
export let containers = [];
export let bookmarks = [];
export let articles = []; // Added articles array for read later functionality
export let activeContainerId = null;
export let draggedContainerId = null;
export let draggedBookmarkId = null;
export let activeSearchEngine = "brave";
export let currentLayout = "grid";
export let currentTheme = "light";

export const bookmarksStorageKey = "my-homepage-bookmarks-v2";
export const containersStorageKey = "my-homepage-containers-v2";
export const articlesStorageKey = "my-homepage-articles-v1"; // Added articles storage key
export const searchEngineStorageKey = "my-homepage-search-engine";
export const layoutStorageKey = "my-homepage-layout";
export const themeStorageKey = "my-homepage-theme";

export function setContainers(newContainers) {
  containers = newContainers;
}

export function setBookmarks(newBookmarks) {
  bookmarks = newBookmarks;
}

export function setArticles(newArticles) {
  articles = newArticles;
}

export function setActiveContainerId(newActiveContainerId) {
  activeContainerId = newActiveContainerId;
}

export function setDraggedContainerId(newDraggedContainerId) {
  draggedContainerId = newDraggedContainerId;
}

export function setDraggedBookmarkId(newDraggedBookmarkId) {
  draggedBookmarkId = newDraggedBookmarkId;
}

export function setActiveSearchEngine(newActiveSearchEngine) {
  activeSearchEngine = newActiveSearchEngine;
}

export function setCurrentLayout(newCurrentLayout) {
  currentLayout = newCurrentLayout;
}

export function setCurrentTheme(newCurrentTheme) {
  currentTheme = newCurrentTheme;
}
