import {
  layoutToggleBtn,
  themeToggleBtn,
  mobileMenuBtn,
  mobileMenuDropdown,
  importBtn,
  exportBtn,
  importFileInput,
} from "../utils/dom.js";
import { toggleLayout, toggleTheme, populateMobileMenu } from "../app.js";
import { showModal } from "../app.js";
import {
  setContainers,
  setBookmarks,
  setArticles,
  containers,
  bookmarks,
  articles,
} from "../state.js";
import { saveData } from "../services/storage.js";
import { render } from "../app.js";

export function initUIEventListeners() {
  layoutToggleBtn.addEventListener("click", toggleLayout);
  themeToggleBtn.addEventListener("click", toggleTheme);

  mobileMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileMenuDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!mobileMenuBtn.contains(e.target)) {
      mobileMenuDropdown.classList.add("hidden");
    }
  });

  mobileMenuDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  exportBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(
      { containers, bookmarks, articles },
      null,
      2
    ); // Include articles in export
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meus_favoritos_backup.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => importFileInput.click());

  importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (
          data &&
          Array.isArray(data.containers) &&
          Array.isArray(data.bookmarks)
        ) {
          const confirmed = await showModal(
            "Isso irá substituir todos os seus favoritos e categorias atuais. Deseja continuar?",
            "Confirmar Importação",
            [
              { text: "Cancelar", class: "secondary", value: false },
              { text: "Continuar", class: "primary", value: true },
            ]
          );
          if (confirmed) {
            setContainers(data.containers);
            setBookmarks(data.bookmarks);
            setArticles(data.articles || []); // Import articles if available
            saveData();
            render();
          }
        } else {
          await showModal("Arquivo de backup inválido.", "Erro");
        }
      } catch (error) {
        await showModal(
          "Erro ao ler o arquivo. Certifique-se de que é um backup válido.",
          "Erro na Importação"
        );
        console.error("Erro na importação:", error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
}
