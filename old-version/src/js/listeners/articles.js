import { articleForm, articleUrlInput } from "../utils/dom.js";
import { showModal, render } from "../app.js";
import { articles, setArticles } from "../state.js";
import { saveData } from "../services/storage.js";
import { extractTitleFromUrl } from "../utils/helpers.js";

export function initArticleEventListeners() {
  articleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = articleUrlInput.value.trim();

    if (!url) return;

    // Validate URL
    try {
      new URL(url.startsWith("http") ? url : "https://" + url);
    } catch {
      await showModal("Por favor, insira uma URL válida.", "URL Inválida");
      return;
    }

    const finalUrl = url.startsWith("http") ? url : "https://" + url;
    const title = extractTitleFromUrl(finalUrl);
    const description = `Artigo salvo de ${new URL(finalUrl).hostname}`;

    const newArticle = {
      id: crypto.randomUUID(),
      title,
      description,
      url: finalUrl,
      dateAdded: new Date().toISOString(),
    };

    articles.unshift(newArticle); // Add to beginning of array
    saveData();
    render();
    articleUrlInput.value = "";

    await showModal("Artigo adicionado com sucesso!", "Sucesso");
  });
}
