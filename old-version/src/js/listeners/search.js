import {
  webSearchBar,
  webSearchForm,
  webSearchButton,
  engineSelectorBtn,
  engineOptions,
  searchResultsWrapper,
  dialog,
} from "../utils/dom.js";
import { render, updateSearchEngineUI } from "../app.js";
import { activeSearchEngine, setActiveSearchEngine } from "../state.js";
import { searchEngines } from "../config/searchEngines.js";

export function initSearchEventListeners() {
  document.addEventListener("keydown", (event) => {
    // FOCO NA BARRA DE PESQUISA AO DIGITAR
    const key = event.key;
    if (
      key.length === 1 &&
      dialog.classList.contains("hidden") &&
      document.activeElement.dataset.role !== "change text"
    ) {
      webSearchBar.focus();
    }
  });
  // RENDERIZAÇÃO DINÂMICA DOS RESULTADOS DE PESQUISA
  webSearchBar.addEventListener("input", (e) => render(e.target.value));

  webSearchBar.addEventListener("keydown", (e) => {
    // FOCO NO PRIMEIRO RESULTADO AO TAB
    if (e.key === "Tab") {
      setTimeout(() => {
        if (searchResultsWrapper.childElementCount > 0) {
          const firstResultLink = searchResultsWrapper.querySelector("a[href]");
          if (firstResultLink) {
            e.preventDefault();
            firstResultLink.focus();
          }
        }
      }, 30); // espera o próximo ciclo do event loop
    }
    // LIMPAR PESQUISA COM ESCAPE
    if (e.key === "Escape") {
      e.target.value = "";
      render();
    }
    // SETA PARA CIMA ALTERA MECANISMO DE PESQUISA
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const engineKeys = Object.keys(searchEngines);
      let currentIndex = engineKeys.indexOf(activeSearchEngine);

      // adiciona engineKeys.length para evitar resultado negativo no modulo
      // subtrai 1 para ir para o mecanismo anterior / adiciona para ir para o próximo
      // usa modulo para circular entre os mecanismos
      // ex: se currentIndex for 0, (0 - 1 + 5) % 5 = 4 (último índice)

      currentIndex = (currentIndex - 1 + engineKeys.length) % engineKeys.length;
      setActiveSearchEngine(engineKeys[currentIndex]);
      updateSearchEngineUI();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const engineKeys = Object.keys(searchEngines);
      let currentIndex = engineKeys.indexOf(activeSearchEngine);

      // adiciona engineKeys.length para evitar resultado negativo no modulo
      // subtrai 1 para ir para o mecanismo anterior / adiciona para ir para o próximo
      // usa modulo para circular entre os mecanismos
      // ex: se currentIndex for 0, (0 - 1 + 5) % 5 = 4 (último índice)

      currentIndex = (currentIndex + 1 + engineKeys.length) % engineKeys.length;
      setActiveSearchEngine(engineKeys[currentIndex]);
      updateSearchEngineUI();
    }
  });

  // NAVEGAÇÃO COM TECLADO NOS RESULTADOS DE PESQUISA
  searchResultsWrapper.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const links = Array.from(
        searchResultsWrapper.querySelectorAll("a[href]")
      );
      const focusedElement = document.activeElement;
      const currentIndex = links.findIndex((link) => link === focusedElement);
      if (currentIndex === -1) {
        if (links.length > 0) links[0].focus();
        return;
      }
      let nextIndex;
      if (e.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + links.length) % links.length;
      } else {
        nextIndex = (currentIndex + 1) % links.length;
      }
      if (links[nextIndex]) {
        links[nextIndex].focus();
      }
    } else if (e.key === "Enter" && document.activeElement.tagName === "A") {
      e.preventDefault();
      document.activeElement.click();
    } else if (e.key === "Escape" && document.activeElement.tagName === "A") {
      webSearchBar.value = "";
      render();
    }
  });
  // SUBMETER PESQUISA
  webSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = webSearchBar.value.trim();
    if (query) {
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;
      if (urlPattern.test(query)) {
        let url = query;
        //se for url, ir direto
        if (!/^https?:\/\//i.test(url)) {
          url = "https://" + url;
        }
        window.open(url, "_self");
      } else {
        // GOOGLE TRANSLATE
        if (searchEngines[activeSearchEngine].name === "Tradutor") {
          let q = query.split(" ");
          let url = ``;

          // se as penultima e ultima palavras foram preenchidas e contem duas letras, atribuir essa letra ao parametro de idioma da url do google translator. se não, atribuir valor default
          if (
            q.length >= 2 &&
            q[q.length - 2].length === 2 &&
            q[q.length - 1].length === 2
          ) {
            url = `https://translate.google.com.br/?sl=${q[q.length - 2]}&tl=${
              q[q.length - 1]
            }&text=${encodeURIComponent(q[0])}&op=translate`;
          } else {
            url = `https://translate.google.com.br/?sl=auto&tl=pt&text=${encodeURIComponent(
              query
            )}&op=translate`;
          }

          window.open(url, "_self");
        } else {
          // ANY OTHER SEARCH ENGINE
          const engine_url = searchEngines[activeSearchEngine].url;
          const fixed_query = encodeURIComponent(query).replace(/%20/g, "+");

          window.open(`${engine_url}${fixed_query}`, "_self");
        }
      }
    }
  });
  // ABRIR NOVA GUIA COM CLIQUE DO MEIO NA LUPA
  webSearchButton.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const query = webSearchBar.value.trim();
    if (e.button == 1) {
      const engine_url = searchEngines[activeSearchEngine].url;
      const fixed_query = encodeURIComponent(query).replace(/%20/g, "+");

      window.open(`${engine_url}${fixed_query}`, "_blank");
    }
  });
  // TOGGLE OPÇÕES DE MECANISMO DE PESQUISA
  engineSelectorBtn.addEventListener("click", () =>
    engineOptions.classList.toggle("hidden")
  );
  // FECHAR OPÇÕES DE MECANISMO DE PESQUISA AO CLICAR FORA
  document.addEventListener("click", (e) => {
    if (
      !engineSelectorBtn.contains(e.target) &&
      !engineOptions.contains(e.target)
    ) {
      engineOptions.classList.add("hidden");
    }
  });
  // POPULAR OPÇÕES DE MECANISMOS DE PESQUISA
  Object.keys(searchEngines).forEach((key) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className =
      "flex items-center gap-2 w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700";
    option.innerHTML = `${searchEngines[key].icon} <span class="dark:text-gray-200">${searchEngines[key].name}</span>`;
    option.addEventListener("click", () => {
      setActiveSearchEngine(key);
      updateSearchEngineUI();
      engineOptions.classList.add("hidden");
    });
    engineOptions.appendChild(option);
  });
}
