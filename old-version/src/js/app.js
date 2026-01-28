import { searchEngines, searchOptions } from "./config/searchEngines.js";
import {
  containers,
  bookmarks,
  articles,
  draggedContainerId,
  draggedBookmarkId,
  activeSearchEngine,
  currentLayout,
  currentTheme,
  setContainers,
  setBookmarks,
  setArticles,
  setActiveContainerId,
  setDraggedContainerId,
  setDraggedBookmarkId,
  setCurrentLayout,
  setCurrentTheme,
} from "./state.js";
import {
  containersWrapper,
  dialog,
  dialogTitle,
  dialogForm,
  bookmarkIdInput,
  bookmarkNameInput,
  bookmarkDescriptionInput,
  bookmarkUrlInput,
  deleteBookmarkBtn,
  webSearchBar,
  engineSelectorBtn,
  importBtn,
  exportBtn,
  gridIcon,
  listIcon,
  alertDialog,
  alertDialogTitle,
  alertDialogMessage,
  alertDialogButtons,
  sunIcon,
  moonIcon,
  searchResultsWrapper,
  mobileMenuDropdown,
  mobileMenuItemsContainer,
  appDiv,
  articlesWrapper,
  navButtons,
} from "./utils/dom.js";
import { extractFaviconFromURL } from "./utils/helpers.js";
import { saveData } from "./services/storage.js";
import {
  tabKeySVG,
  layoutIconSvg,
  themeIconSvg,
  ellipsisSVG,
  addIconSVG,
} from "./svgs/index.js";

// --- FUNÇÕES DE LÓGICA ---
export const showModal = (
  message,
  title = "Atenção",
  buttons = [{ text: "OK", class: "primary" }]
) => {
  return new Promise((resolve) => {
    alertDialogTitle.textContent = title;
    alertDialogMessage.textContent = message;
    alertDialogButtons.innerHTML = "";
    buttons.forEach((btnInfo) => {
      const button = document.createElement("button");
      button.textContent = btnInfo.text;
      const baseClass = "font-semibold py-2 px-6 rounded-lg transition-colors";
      if (btnInfo.class === "danger") {
        button.className = `${baseClass} bg-red-600 text-white hover:bg-red-700`;
      } else if (btnInfo.class === "secondary") {
        button.className = `${baseClass} bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500`;
      } else {
        button.className = `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
      }
      button.addEventListener("click", () => {
        alertDialog.classList.add("hidden");
        resolve(btnInfo.value);
      });
      alertDialogButtons.appendChild(button);
    });
    alertDialog.classList.remove("hidden");
  });
};

const createSearchResultsElement = (
  searchTerm = "",
  option = { url: "", icon: "", placeholder: "" }
) => {
  const seachEnginesSuggestions = document.createElement("a");
  seachEnginesSuggestions.href = `${option.url}${searchTerm}`;
  const span = `<span class="italic font-bold">${searchTerm}</span>`;
  seachEnginesSuggestions.className = `flex items-center gap-3 my-1 p-3
           rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`;
  seachEnginesSuggestions.dataset.id = "search-option";
  seachEnginesSuggestions.innerHTML = `
        <span class="max-w-full h-auto">${option.icon}</span>
        <span class="text-gray-700 dark:text-gray-200 truncate">
            ${option.placeholder.replace("{palavra}", span)}
        </span>
        `;
  return seachEnginesSuggestions;
};
export const render = (searchTerm = "") => {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  if (lowerCaseSearchTerm) {
    appDiv.classList.add("hidden");
    searchResultsWrapper.classList.remove("hidden");
    searchResultsWrapper.innerHTML = "";
    const filteredBookmarks = bookmarks.filter(
      ({ name, title, description }) => {
        const lowerCaseName = name ? name.toLowerCase() : "";
        const lowerCaseTitle = title ? title.toLowerCase() : "";
        const lowerCaseDescription = description
          ? description.toLowerCase()
          : "";

        return (
          lowerCaseName.includes(lowerCaseSearchTerm) ||
          lowerCaseTitle.includes(lowerCaseSearchTerm) ||
          lowerCaseDescription.includes(lowerCaseSearchTerm)
        );
      }
    );
    const filteredArticles = articles.filter((a) =>
      a.title.toLowerCase().includes(lowerCaseSearchTerm)
    );

    // CRIAR ELEMENTO DE RESULTADOS
    const resultsContainer = document.createElement("div");
    resultsContainer.className =
      "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative transition-all w-full";
    const header = document.createElement("div");
    header.className = "flex justify-between items-center mb-4";
    const tabKeyIcon = document.createElement("span");
    tabKeyIcon.innerHTML = tabKeySVG;
    const titleElement = document.createElement("h2");
    titleElement.className =
      "text-xl font-bold text-gray-600 dark:text-gray-400";
    titleElement.textContent = `🔍 Sites encontrados`;
    header.appendChild(titleElement);
    header.appendChild(tabKeyIcon);
    resultsContainer.appendChild(header);
    const resultsList = document.createElement("div");
    resultsList.className = "flex flex-col gap-1";
    const originalLayout = currentLayout;
    setCurrentLayout("list");
    // SE ENCONTRAR RESULTADOS - SITES FAVORITOS OU ARTIGOS
    if (filteredBookmarks.length > 0 || filteredArticles.length > 0) {
      filteredBookmarks.forEach((bookmark) => {
        resultsList.appendChild(createBookmarkElement(bookmark));
      });
      filteredArticles.forEach((article) => {
        resultsList.appendChild(createBookmarkElement(article));
      });
      setCurrentLayout(originalLayout);
      resultsContainer.appendChild(resultsList);
      searchResultsWrapper.appendChild(resultsContainer);
    }
    // SE NÃO ENCONTRAR RESULTADOS, SUGERIR OUTRAS PESQUISAS
    else {
      setCurrentLayout(originalLayout);

      const notFoundMessage = document.createElement("p");
      notFoundMessage.innerHTML = `<p class="text-center text-sm text-gray-400 dark:text-gray-600 w-full py-8">Aperte ENTER para pesquisar ou... </p>`;
      searchResultsWrapper.appendChild(notFoundMessage);

      titleElement.textContent = `💭 Você quer`;

      searchOptions.forEach((option) => {
        const seachEnginesSuggestions = createSearchResultsElement(
          searchTerm,
          option
        );

        resultsContainer.appendChild(seachEnginesSuggestions);
      });
      searchResultsWrapper.appendChild(resultsContainer);
    }
  } else {
    appDiv.classList.remove("hidden");
    searchResultsWrapper.classList.add("hidden");
    searchResultsWrapper.innerHTML = "";
    containersWrapper.innerHTML = "";
    containers.forEach((container) => {
      const containerBookmarks = bookmarks.filter(
        (b) => b.containerId === container.id
      );
      containersWrapper.appendChild(
        createContainerElement(container, containerBookmarks)
      );
    });
    if (containersWrapper.innerHTML !== "" || containers.length === 0) {
      containersWrapper.appendChild(createAddCategoryBox());
    }
  }
  renderArticles(); // Always render articles when updating the page
};

const createContainerElement = (container, containerBookmarks) => {
  const element = document.createElement("div");
  element.className = `bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative group/category transition-all`;
  element.setAttribute("draggable", "true");

  element.dataset.id = container.id;
  element.addEventListener("dragstart", (e) => {
    setDraggedContainerId(container.id);
    setTimeout(() => e.target.classList.add("dragging"), 0);
  });
  element.addEventListener("dragend", (e) =>
    e.target.classList.remove("dragging")
  );
  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.target.closest(".group\\/category").classList.add("drag-over");
  });
  element.addEventListener("dragleave", (e) =>
    e.target.closest(".group\\/category").classList.remove("drag-over")
  );
  element.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetContainer = e.target.closest(".group\\/category");
    targetContainer.classList.remove("drag-over");
    if (draggedBookmarkId) {
      const bookmark = bookmarks.find((b) => b.id === draggedBookmarkId);
      if (bookmark) {
        bookmark.containerId = container.id;
        saveData();
        render(webSearchBar.value);
      }
    } else if (draggedContainerId && draggedContainerId !== container.id) {
      const draggedIndex = containers.findIndex(
        (c) => c.id === draggedContainerId
      );
      const targetIndex = containers.findIndex((c) => c.id === container.id);
      const [draggedItem] = containers.splice(draggedIndex, 1);
      containers.splice(targetIndex, 0, draggedItem);
      saveData();
      render(webSearchBar.value);
    }
    setDraggedBookmarkId(null);
    setDraggedContainerId(null);
  });
  const header = document.createElement("div");
  header.className = "flex justify-between items-center mb-4";
  const titleElement = document.createElement("h2");
  titleElement.className =
    "text-xl font-bold text-gray-800 dark:text-gray-200 cursor-pointer flex-grow";
  titleElement.textContent = container.title;
  titleElement.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.role = "change text";
    input.value = container.title;
    input.className =
      "text-xl font-bold text-gray-800 dark:text-gray-200 title-input";
    const saveEdit = () => {
      const newTitle = input.value.trim();
      if (newTitle) container.title = newTitle;
      saveData();
      render(webSearchBar.value);
    };
    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") render(webSearchBar.value);
    });
    titleElement.replaceWith(input);
    input.focus();
    input.select();
  });
  const removeContainerBtn = document.createElement("button");
  removeContainerBtn.className =
    "absolute top-3 right-3 w-7 h-7 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-lg opacity-0 group-hover/category:opacity-100 transition-all duration-200 hover:bg-red-500 hover:text-white";
  removeContainerBtn.innerHTML = "&times;";
  removeContainerBtn.ariaLabel = `Remover pasta ${container.title}`;
  removeContainerBtn.addEventListener("click", async () => {
    const confirmed = await showModal(
      `Tem certeza que deseja remover a pasta "${container.title}" e todos os seus favoritos?`,
      "Confirmar Exclusão",
      [
        { text: "Cancelar", class: "secondary", value: false },
        { text: "Remover", class: "danger", value: true },
      ]
    );
    if (confirmed) {
      setContainers(containers.filter((c) => c.id !== container.id));
      setBookmarks(bookmarks.filter((b) => b.containerId !== container.id));
      saveData();
      render(webSearchBar.value);
    }
  });
  header.appendChild(titleElement);

  element.appendChild(removeContainerBtn);

  const grid = document.createElement("div");
  grid.dataset.id = "container";
  grid.className =
    currentLayout === "grid" ? "flex flex-wrap gap-2" : "flex flex-col gap-1";
  containerBookmarks.forEach((bookmark) =>
    grid.appendChild(createBookmarkElement(bookmark))
  );
  const addBookmarkBox = createAddBookmarkBox(
    container.id,
    containerBookmarks.length > 0
  );
  grid.appendChild(addBookmarkBox);
  element.appendChild(header);
  element.appendChild(grid);
  return element;
};

const createBookmarkElement = (bookmark) => {
  const faviconUrl = extractFaviconFromURL(bookmark.url);

  const element = document.createElement("div");
  element.setAttribute("draggable", "true");
  element.dataset.id = bookmark.id;
  // SE LAYOUT FOR LISTA
  if (currentLayout === "list") {
    containersWrapper.classList =
      "grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6";
    element.className =
      "relative flex items-center group/item p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50";
    // adicionar target="_blank" ao element <a> para abrir em nova guia
    element.innerHTML = `
                    <a href="${
                      bookmark.url
                    }" rel="noopener noreferrer" class="flex items-center flex-grow" title="${
      bookmark.description || ""
    }">
                        <img src="${faviconUrl}" alt="${
      bookmark.title ?? bookmark.name
    }" class="w-6 h-6 object-contain mr-3 rounded" />
                        <span class="flex-grow text-sm text-gray-700 dark:text-gray-300">${
                          bookmark.title ?? bookmark.name
                        }</span>
                    </a>
                    <div class="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button class="edit-bookmark-btn p-1 text-gray-500 hover:text-blue-600">
                        ${ellipsisSVG}

                        </button>
                        
                    </div>`;
  }
  // SE LAYOUT FOR GRID
  else {
    containersWrapper.classList =
      "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6";
    element.className =
      "relative flex flex-col items-center group/item w-20 rounded-lg  hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors duration-200";
    element.innerHTML = `
                    <a href="${bookmark.url}" rel="noopener noreferrer"
                      class="flex flex-col items-center p-2" title="${
                        bookmark.description || ""
                      }">
                        <img src="${faviconUrl}" alt="Ícone de ${
      bookmark.title ?? bookmark.name
    }" class="w-7 h-7 object-contain mb-2 rounded-md shadow-sm"  />
                        <span class="text-sm text-gray-700 dark:text-gray-300 text-center w-full px-1">${
                          bookmark.title ?? bookmark.name
                        }</span>
                    </a>
                    <button aria-label="edit-bookmark" class="edit-bookmark-btn absolute top-0 left-0 p-1 text-gray-500 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                         ${ellipsisSVG}
                    </button>
                    `;
  }
  element.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    setDraggedBookmarkId(bookmark.id);
    setTimeout(() => element.classList.add("dragging"), 0);
  });
  element.addEventListener("dragend", () =>
    element.classList.remove("dragging")
  );
  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add("drag-over-bookmark");
  });
  element.addEventListener("dragleave", () =>
    element.classList.remove("drag-over-bookmark")
  );
  element.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("drag-over-bookmark");
    if (!draggedBookmarkId || draggedBookmarkId === bookmark.id) return;
    const draggedIndex = bookmarks.findIndex((b) => b.id === draggedBookmarkId);
    const targetIndex = bookmarks.findIndex((b) => b.id === bookmark.id);
    const [draggedItem] = bookmarks.splice(draggedIndex, 1);
    bookmarks.splice(targetIndex, 0, draggedItem);
    draggedItem.containerId = bookmark.containerId;
    saveData();
    render(webSearchBar.value);
  });
  element.querySelector(".edit-bookmark-btn").addEventListener("click", () => {
    dialogTitle.textContent = "Editar Favorito";
    bookmarkIdInput.value = bookmark.id;
    bookmarkNameInput.value = bookmark.name ?? bookmark.title;
    bookmarkDescriptionInput.value = bookmark.description || "";
    bookmarkUrlInput.value = bookmark.url;
    dialog.classList.remove("hidden");
    deleteBookmarkBtn.classList.remove("hidden");
  });
  return element;
};

const createAddBookmarkBox = (containerId, hasBookmarks) => {
  const addBookmarkBox = document.createElement("button");
  addBookmarkBox.className = "add-bookmark-trigger";
  addBookmarkBox.ariaLabel = "add-bookmark";
  addBookmarkBox.className = `flex p-2 items-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-opacity duration-300
  ${currentLayout === "list" ? "" : "flex-col justify-center"}
  ${hasBookmarks ? "opacity-0 group-hover/category:opacity-100" : ""}`;

  if (currentLayout === "list") {
    addBookmarkBox.innerHTML = `<span class="mr-2">${addIconSVG}</span>
                                <span class="text-sm">Adicionar</span>`;
  } else {
    addBookmarkBox.innerHTML = `
                    <div class="flex items-center justify-center w-8 h-8 rounded-md border-2 border-dashed border-gray-400 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-600 transition-colors">
                        ${addIconSVG}
                    </div>
                    <span class="mt-2 text-sm">Adicionar</span>`;
  }
  addBookmarkBox.addEventListener("click", () => {
    dialogTitle.textContent = "Adicionar novo site favorito";
    dialogForm.reset();
    bookmarkIdInput.value = "";
    setActiveContainerId(containerId);
    dialog.classList.remove("hidden");
    deleteBookmarkBtn.classList.add("hidden");
  });
  return addBookmarkBox;
};

const createAddCategoryBox = () => {
  const addContainerBox = document.createElement("div");
  addContainerBox.className =
    "cursor-pointer bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 px-8 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center justify-center min-h-[148px]";
  const addTitle = document.createElement("h2");
  addTitle.className = "text-xl font-bold text-gray-400 text-center";
  addTitle.textContent = "+ Criar Pasta";
  addContainerBox.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Nome da Pasta";
    input.dataset.role = "change text";
    input.className =
      "text-xl font-bold text-gray-800 dark:text-gray-200 title-input text-center";
    const saveNew = () => {
      const title = input.value.trim();
      if (title) {
        containers.push({ id: crypto.randomUUID(), title });
        saveData();
      }
      render();
    };
    input.addEventListener("blur", saveNew);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") render();
    });
    addContainerBox.innerHTML = "";
    addContainerBox.appendChild(input);
    input.focus();
  });
  addContainerBox.appendChild(addTitle);
  return addContainerBox;
};

const createArticleElement = (article) => {
  const element = document.createElement("div");
  element.className =
    "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow group relative";
  // adicionar target="_blank" ao element <a> para abrir em nova guia
  element.innerHTML = `
      <div class="flex flex-col h-full">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">${
          article.title
        }</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow">${
          article.description
        }</p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 dark:text-gray-500">${new Date(
            article.dateAdded
          ).toLocaleDateString("pt-BR")}
          </span>
          <div class="flex gap-2">
            <a href="${article.url}"  rel="noopener noreferrer" 
               class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
              Ler
            </a>
            <button aria-label="delete-article" class="remove-article-btn text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Remover
            </button>
          </div>
        </div>
      </div>
    `;

  // Add remove functionality
  element
    .querySelector(".remove-article-btn")
    .addEventListener("click", async () => {
      const confirmed = await showModal(
        `Tem certeza que deseja remover este artigo?`,
        "Confirmar Remoção",
        [
          { text: "Cancelar", class: "secondary", value: false },
          { text: "Remover", class: "danger", value: true },
        ]
      );
      if (confirmed) {
        setArticles(articles.filter((a) => a.id !== article.id));
        saveData();
        renderArticles();
      }
    });

  return element;
};

const renderArticles = () => {
  articlesWrapper.innerHTML = "";

  articles.forEach((article) => {
    articlesWrapper.appendChild(createArticleElement(article));
  });
};

// REDERIZA OS BOTÕES - TEMA, LAYOUT, ETC
export const renderNavButtons = () => {
  navButtons.forEach((btn) => {
    btn.classList.remove("invisible");
  });
};

export const updateSearchEngineUI = () => {
  const { icon, placeholder, name } = searchEngines[activeSearchEngine];

  engineSelectorBtn.innerHTML = icon;
  localStorage.setItem("my-homepage-search-engine", activeSearchEngine);
  webSearchBar.placeholder = `${placeholder}`;

  if (name === "Tradutor")
    webSearchBar.placeholder =
      "parametros: [Pesquisa] [idioma fonte (en)] [idioma destino (pt)]";
};

export const applyLayout = () => {
  if (currentLayout === "grid") {
    gridIcon.classList.add("hidden");
    listIcon.classList.remove("hidden");
  } else {
    gridIcon.classList.remove("hidden");
    listIcon.classList.add("hidden");
  }
  render(webSearchBar.value);
};

export const toggleLayout = () => {
  setCurrentLayout(currentLayout === "grid" ? "list" : "grid");
  localStorage.setItem("my-homepage-layout", currentLayout);
  applyLayout();
};

export const applyTheme = () => {
  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark");
    sunIcon.classList.add("hidden");
    moonIcon.classList.remove("hidden");
  } else {
    document.documentElement.classList.remove("dark");
    sunIcon.classList.remove("hidden");
    moonIcon.classList.add("hidden");
  }
};

export const toggleTheme = () => {
  setCurrentTheme(currentTheme === "light" ? "dark" : "light");
  localStorage.setItem("my-homepage-theme", currentTheme);
  applyTheme();
};

export const populateMobileMenu = () => {
  const createMenuItem = (text, iconSvg, clickHandler) => {
    const item = document.createElement("button");
    item.className =
      "w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";
    item.innerHTML = `<div class="w-6 h-6 flex items-center justify-center">${iconSvg}</div><span>${text}</span>`;
    item.addEventListener("click", () => {
      clickHandler();
      mobileMenuDropdown.classList.add("hidden");
    });
    return item;
  };

  const menuItems = [
    { text: "Alterar Tema", handler: toggleTheme, icon: themeIconSvg },
    { text: "Alterar Layout", handler: toggleLayout, icon: layoutIconSvg },
    {
      text: "Importar Favoritos",
      handler: () => importBtn.click(),
      icon: importBtn.innerHTML,
    },
    {
      text: "Salvar Favoritos",
      handler: () => exportBtn.click(),
      icon: exportBtn.innerHTML,
    },
  ];

  mobileMenuItemsContainer.innerHTML = "";
  menuItems.forEach((itemInfo) => {
    const item = createMenuItem(itemInfo.text, itemInfo.icon, itemInfo.handler);
    mobileMenuItemsContainer.appendChild(item);
  });
};
