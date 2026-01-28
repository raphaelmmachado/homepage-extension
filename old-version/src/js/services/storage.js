import {
  containers,
  bookmarks,
  articles,
  activeSearchEngine,
  currentLayout,
  currentTheme,
  setContainers,
  setBookmarks,
  setArticles,
  setActiveSearchEngine,
  setCurrentLayout,
  setCurrentTheme,
  containersStorageKey,
  bookmarksStorageKey,
  articlesStorageKey,
  searchEngineStorageKey,
  layoutStorageKey,
  themeStorageKey,
} from "../state.js";

export const saveData = () => {
  localStorage.setItem(containersStorageKey, JSON.stringify(containers));
  localStorage.setItem(bookmarksStorageKey, JSON.stringify(bookmarks));
  localStorage.setItem(articlesStorageKey, JSON.stringify(articles)); // Save articles to localStorage
};

export const loadData = () => {
  const savedContainers = localStorage.getItem(containersStorageKey);
  const savedBookmarks = localStorage.getItem(bookmarksStorageKey);
  const savedArticles = localStorage.getItem(articlesStorageKey); // Load articles from localStorage
  const savedEngine = localStorage.getItem(searchEngineStorageKey);
  const savedLayout = localStorage.getItem(layoutStorageKey);
  const savedTheme = localStorage.getItem(themeStorageKey);

  setContainers(savedContainers ? JSON.parse(savedContainers) : []);
  setBookmarks(savedBookmarks ? JSON.parse(savedBookmarks) : []);
  setArticles(savedArticles ? JSON.parse(savedArticles) : []); // Initialize articles array
  setActiveSearchEngine(savedEngine || "brave");
  setCurrentLayout(savedLayout || "grid");
  setCurrentTheme(savedTheme || "light");
};
