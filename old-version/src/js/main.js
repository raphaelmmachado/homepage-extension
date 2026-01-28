import { loadData } from "./services/storage.js";
import {
  applyLayout,
  updateSearchEngineUI,
  applyTheme,
  renderNavButtons,
  populateMobileMenu,
  render,
} from "./app.js";
import { initUIEventListeners } from "./listeners/ui.js";
import { initSearchEventListeners } from "./listeners/search.js";
import { initBookmarkEventListeners } from "./listeners/bookmarks.js";
import { initArticleEventListeners } from "./listeners/articles.js";

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  applyLayout();
  updateSearchEngineUI();
  applyTheme();
  renderNavButtons();
  populateMobileMenu();
  render();

  initUIEventListeners();
  initSearchEventListeners();
  initBookmarkEventListeners();
  initArticleEventListeners();
});
