import {
  dialog,
  dialogForm,
  bookmarkIdInput,
  bookmarkNameInput,
  bookmarkDescriptionInput,
  bookmarkUrlInput,
  deleteBookmarkBtn,
  cancelBtn,
  webSearchBar,
} from "../utils/dom.js";
import { render, showModal } from "../app.js";
import { bookmarks, setBookmarks, activeContainerId } from "../state.js";
import { saveData } from "../services/storage.js";

export function initBookmarkEventListeners() {
  dialogForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = bookmarkIdInput.value;
    const title = bookmarkNameInput.value.trim();
    const description = bookmarkDescriptionInput.value.trim();
    const url = bookmarkUrlInput.value.trim();
    if (title && url) {
      const cleanedUrl = url
        .replace(/^(?:https?:\/\/)?/i, "")
        .replace(/^www\./i, "");
      const finalUrl = "https://" + cleanedUrl;
      if (id) {
        const bookmark = bookmarks.find((b) => b.id === id);
        if (bookmark) {
          bookmark.title = title;
          bookmark.description = description;
          bookmark.url = finalUrl;
        }
      } else {
        bookmarks.push({
          id: crypto.randomUUID(),
          title,
          description,
          url: finalUrl,
          containerId: activeContainerId,
        });
      }
      saveData();
      render(webSearchBar.value);
      dialog.classList.add("hidden");
    }
  });
  deleteBookmarkBtn.addEventListener("click", async () => {
    const id = bookmarkIdInput.value;
    if (!id) return;

    const confirmed = await showModal(
      "Tem certeza que deseja remover este favorito?",
      "Confirmar Exclusão",
      [
        { text: "Cancelar", class: "secondary", value: false },
        { text: "Remover", class: "danger", value: true },
      ]
    );

    if (confirmed) {
      setBookmarks(bookmarks.filter((b) => b.id !== id));
      saveData();
      render(webSearchBar.value);
      dialog.classList.add("hidden");
    }
  });
  cancelBtn.addEventListener("click", () => dialog.classList.add("hidden"));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) cancelBtn.click();
  });
}
