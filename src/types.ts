export interface Bookmark {
  id: string;
  containerId: string;
  name?: string;
  title?: string;
  url: string;
  description?: string;
  clicks?: number;
  customIcon?: string;
}

export interface Container {
  id: string;
  title: string;
}

export type Layout = 'grid' | 'list';
export type Theme = 'light' | 'dark';

export const STORAGE_KEYS = {
  BOOKMARKS: "my-homepage-bookmarks-v2",
  CONTAINERS: "my-homepage-containers-v2",
  BOOKMARK_CLICKS: "my-homepage-bookmark-clicks",
  CUSTOM_ICONS: "my-homepage-custom-icons",
  DESCRIPTIONS: "my-homepage-bookmark-descriptions",
  SEARCH_ENGINE: "my-homepage-search-engine",
  LAYOUT: "my-homepage-layout",
  THEME: "my-homepage-theme",
};

