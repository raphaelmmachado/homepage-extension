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

    if (typeof chrome === "undefined" || !chrome.bookmarks) {
      return { containers: [], bookmarks: [], archivedContainerIds };
    }

    const tree = await chrome.bookmarks.getTree();
    const bookmarksBar =
      tree[0]?.children?.find((node: chrome.bookmarks.BookmarkTreeNode) => node.id === "1") ||
      tree[0]?.children?.[0];

    if (!bookmarksBar || !bookmarksBar.children) {
      return { containers: [], bookmarks: [], archivedContainerIds };
    }

    const savedClicks = this.getLocalData(STORAGE_KEYS.BOOKMARK_CLICKS);
    const savedIcons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
    const savedDescriptions = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);

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
    if (typeof chrome === "undefined" || !chrome.bookmarks) return null;
    const result = await chrome.bookmarks.create({ parentId: "1", title });
    return { id: result.id, title: result.title };
  }

  static async updateContainerTitle(id: string, title: string) {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.update(id, { title });
    }
  }

  static async deleteContainer(id: string) {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.removeTree(id);
    }
  }

  static async createBookmark(data: { parentId: string; title: string; url: string; customIcon?: string; description?: string }): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    if (typeof chrome === "undefined" || !chrome.bookmarks) return null;
    const { parentId, title, url, customIcon, description } = data;
    
    let finalUrl = url;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
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

  static async updateBookmark(id: string, urlStr: string, updates: { title?: string; url?: string; customIcon?: string; description?: string }) {
    const { title, url, customIcon, description } = updates;
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.update(id, { title, url });
    }
    
    const finalUrl = url || urlStr;
    if (customIcon !== undefined) {
      const icons = this.getLocalData(STORAGE_KEYS.CUSTOM_ICONS);
      icons[finalUrl] = customIcon;
      this.setLocalData(STORAGE_KEYS.CUSTOM_ICONS, icons);
    }

    if (description !== undefined) {
      const desc = this.getLocalData(STORAGE_KEYS.DESCRIPTIONS);
      desc[finalUrl] = description;
      this.setLocalData(STORAGE_KEYS.DESCRIPTIONS, desc);
    }
  }

  static async deleteBookmark(id: string) {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.remove(id);
    }
  }

  static async moveBookmark(id: string, newParentId: string, index?: number) {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      await chrome.bookmarks.move(id, { parentId: newParentId, index });
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
