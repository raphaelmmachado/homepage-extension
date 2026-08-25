import type { Bookmark, Container } from "../types";
import { STORAGE_KEYS } from "../types";

const chrome = globalThis.chrome;

export interface BookmarkData {
  containers: Container[];
  bookmarks: Bookmark[];
  archivedContainerIds: string[];
}

export class BookmarkRepo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getLocalData(key: string): Record<string, any> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static setLocalData(key: string, data: Record<string, any>) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static async loadTree(): Promise<BookmarkData> {
    const archivedIdsRaw = localStorage.getItem(STORAGE_KEYS.ARCHIVED_CONTAINERS);
    const archivedContainerIds: string[] = archivedIdsRaw ? JSON.parse(archivedIdsRaw) : [];

    const savedClicks = this.getLocalData(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedIcons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
    const savedDescriptions = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      let containers: Container[] = [];
      let bookmarks: Bookmark[] = [];

      try {
        const rawContainers = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
        const rawBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);

        if (rawContainers) {
          containers = JSON.parse(rawContainers);
        } else {
          containers = [{ id: "1", title: "Favoritos" }];
          localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
        }

        if (rawBookmarks) {
          bookmarks = JSON.parse(rawBookmarks);
        }
      } catch (e) {
        console.error("Failed to parse local fallback:", e);
      }

      bookmarks = bookmarks.map((b) => ({
        ...b,
        clicks: savedClicks[b.url] || b.clicks || 0,
        customIcon: savedIcons[b.url] || savedIcons[b.id] || b.customIcon,
        description: savedDescriptions[b.url] || savedDescriptions[b.id] || b.description || "",
      }));

      return { containers, bookmarks, archivedContainerIds };
    }

    const tree = await chrome.bookmarks.getTree();
    const bookmarksBar =
      tree[0]?.children?.find((node: chrome.bookmarks.BookmarkTreeNode) => node.id === "1") ||
      tree[0]?.children?.[0];

    if (!bookmarksBar || !bookmarksBar.children) {
      return { containers: [], bookmarks: [], archivedContainerIds };
    }

    const containers: Container[] = [];
    const bookmarks: Bookmark[] = [];
    let hasLooseBookmarks = false;

    for (const node of bookmarksBar.children) {
      if (node.url) {
        hasLooseBookmarks = true;
        bookmarks.push({
          id: node.id,
          containerId: "1",
          title: node.title,
          name: node.title,
          url: node.url,
          clicks: savedClicks[node.url] || 0,
          customIcon: savedIcons[node.url] || savedIcons[node.id],
          description: savedDescriptions[node.url] || savedDescriptions[node.id] || "",
        });
      } else {
        containers.push({ id: node.id, title: node.title });
        if (node.children) {
          for (const child of node.children) {
            if (child.url) {
              bookmarks.push({
                id: child.id,
                containerId: node.id,
                title: child.title,
                name: child.title,
                url: child.url,
                clicks: savedClicks[child.url] || 0,
                customIcon: savedIcons[child.url] || savedIcons[child.id],
                description: savedDescriptions[child.url] || savedDescriptions[child.id] || "",
              });
            }
          }
        }
      }
    }

    if (hasLooseBookmarks) {
      containers.unshift({ id: "1", title: "Outros Favoritos" });
    }

    return { containers, bookmarks, archivedContainerIds };
  }

  static async createContainer(title: string): Promise<Container | null> {
    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      const containersRaw = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      const containers: Container[] = containersRaw ? JSON.parse(containersRaw) : [];
      const newContainer = { id: crypto.randomUUID(), title };
      containers.push(newContainer);
      localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
      return newContainer;
    }
    const result = await chrome.bookmarks.create({ parentId: "1", title });
    return { id: result.id, title: result.title };
  }

  static async updateContainerTitle(id: string, title: string) {
    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      const containersRaw = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      if (containersRaw) {
        const containers: Container[] = JSON.parse(containersRaw);
        const container = containers.find((c) => c.id === id);
        if (container) {
          container.title = title;
          localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
        }
      }
      return;
    }
    await chrome.bookmarks.update(id, { title });
  }

  static async deleteContainer(id: string) {
    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      const containersRaw = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      if (containersRaw) {
        const containers: Container[] = JSON.parse(containersRaw).filter((c: Container) => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
      }
      const bookmarksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (bookmarksRaw) {
        const bookmarks: Bookmark[] = JSON.parse(bookmarksRaw).filter((b: Bookmark) => b.containerId !== id);
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      }
      return;
    }
    await chrome.bookmarks.removeTree(id);
  }

  static async createBookmark(data: { parentId: string; title: string; url: string; customIcon?: string; description?: string }): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    const { parentId, title, url, customIcon, description } = data;
    
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      const bookmarksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      const bookmarks: Bookmark[] = bookmarksRaw ? JSON.parse(bookmarksRaw) : [];
      const newBm: Bookmark = {
        id: crypto.randomUUID(),
        containerId: parentId,
        title,
        name: title,
        url: finalUrl,
      };
      bookmarks.push(newBm);
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));

      if (customIcon) {
        const icons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
        icons[finalUrl] = customIcon;
        this.setLocalData(STORAGE_KEYS.CUSTOM_ICONS, icons);
      }

      if (description) {
        const desc = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);
        desc[finalUrl] = description;
        this.setLocalData(STORAGE_KEYS.DESCRIPTIONS, desc);
      }

      return { id: newBm.id, parentId, title, url: finalUrl } as unknown as chrome.bookmarks.BookmarkTreeNode;
    }

    const result = await chrome.bookmarks.create({ parentId, title, url: finalUrl });
    
    if (customIcon) {
      const icons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
      icons[result.url!] = customIcon;
      this.setLocalData(STORAGE_KEYS.CUSTOM_ICONS, icons);
    }

    if (description) {
      const desc = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);
      desc[result.url!] = description;
      this.setLocalData(STORAGE_KEYS.DESCRIPTIONS, desc);
    }
    
    return result;
  }

  static async updateBookmark(
    id: string,
    urlStr: string,
    updates: { title?: string; url?: string; customIcon?: string; description?: string }
  ) {
    const { title, url, customIcon, description } = updates;
    
    let finalUrl = (url || urlStr || "").trim();
    if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.update(id, {
        ...(title !== undefined ? { title } : {}),
        ...(finalUrl ? { url: finalUrl } : {}),
      });
    } else {
      const bookmarksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (bookmarksRaw) {
        const bookmarks: Bookmark[] = JSON.parse(bookmarksRaw);
        const bm = bookmarks.find((b) => b.id === id);
        if (bm) {
          if (title !== undefined) {
            bm.title = title;
            bm.name = title;
          }
          if (finalUrl) {
            bm.url = finalUrl;
          }
          localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
        }
      }
    }
    
    // Synchronize custom icon metadata
    if (customIcon !== undefined) {
      const icons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
      if (urlStr && urlStr !== finalUrl) {
        delete icons[urlStr];
      }
      delete icons[id];

      if (customIcon.trim()) {
        icons[finalUrl] = customIcon.trim();
      } else {
        delete icons[finalUrl];
      }
      this.setLocalData(STORAGE_KEYS.CUSTOM_ICONS, icons);
    }

    // Synchronize description metadata
    if (description !== undefined) {
      const desc = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);
      if (urlStr && urlStr !== finalUrl) {
        delete desc[urlStr];
      }
      delete desc[id];

      if (description.trim()) {
        desc[finalUrl] = description.trim();
      } else {
        delete desc[finalUrl];
      }
      this.setLocalData(STORAGE_KEYS.DESCRIPTIONS, desc);
    }

    // Migrate click count if URL changed
    if (urlStr && finalUrl && urlStr !== finalUrl) {
      const clicks = this.getLocalData(STORAGE_KEYS.BOOKMARK_CLICKS);
      if (clicks[urlStr] !== undefined) {
        clicks[finalUrl] = (clicks[finalUrl] || 0) + clicks[urlStr];
        delete clicks[urlStr];
        this.setLocalData(STORAGE_KEYS.BOOKMARK_CLICKS, clicks);
      }
    }
  }

  static async deleteBookmark(id: string, url?: string) {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.remove(id);
    } else {
      const bookmarksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (bookmarksRaw) {
        const bookmarks: Bookmark[] = JSON.parse(bookmarksRaw).filter((b: Bookmark) => b.id !== id);
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      }
    }

    if (url) {
      const clicks = this.getLocalData(STORAGE_KEYS.BOOKMARK_CLICKS);
      delete clicks[url];
      this.setLocalData(STORAGE_KEYS.BOOKMARK_CLICKS, clicks);
    }

    const icons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
    if (url) delete icons[url];
    delete icons[id];
    this.setLocalData(STORAGE_KEYS.CUSTOM_ICONS, icons);

    const desc = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);
    if (url) delete desc[url];
    delete desc[id];
    this.setLocalData(STORAGE_KEYS.DESCRIPTIONS, desc);
  }

  static async moveBookmark(id: string, newParentId: string, index?: number) {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.move(id, { parentId: newParentId, index });
    } else {
      const bookmarksRaw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (bookmarksRaw) {
        const bookmarks: Bookmark[] = JSON.parse(bookmarksRaw);
        const bm = bookmarks.find((b) => b.id === id);
        if (bm) {
          bm.containerId = newParentId;
          localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
        }
      }
    }
  }
  
  static incrementClicks(url: string) {
    const clicks = this.getLocalData(STORAGE_KEYS.BOOKMARK_CLICKS);
    clicks[url] = (clicks[url] || 0) + 1;
    this.setLocalData(STORAGE_KEYS.BOOKMARK_CLICKS, clicks);
  }

  static archiveContainer(id: string) {
    const ids = this.getLocalData(STORAGE_KEYS.ARCHIVED_CONTAINERS) || [];
    if (!Array.isArray(ids)) {
      this.setLocalData(STORAGE_KEYS.ARCHIVED_CONTAINERS, [id]);
    } else if (!ids.includes(id)) {
      this.setLocalData(STORAGE_KEYS.ARCHIVED_CONTAINERS, [...ids, id]);
    }
  }

  static unarchiveContainer(id: string) {
    const ids = this.getLocalData(STORAGE_KEYS.ARCHIVED_CONTAINERS) || [];
    if (Array.isArray(ids)) {
      this.setLocalData(STORAGE_KEYS.ARCHIVED_CONTAINERS, ids.filter((i) => i !== id));
    }
  }
}
