export interface Bookmark {
  id: string;
  containerId: string;
  name?: string;
  title?: string;
  url: string;
  description?: string;
}

export interface Container {
  id: string;
  title: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  dateAdded: number;
}

export type Layout = 'grid' | 'list';
export type Theme = 'light' | 'dark';

export const STORAGE_KEYS = {
  BOOKMARKS: "my-homepage-bookmarks-v2",
  CONTAINERS: "my-homepage-containers-v2",
  ARTICLES: "my-homepage-articles-v1",
  SEARCH_ENGINE: "my-homepage-search-engine",
  LAYOUT: "my-homepage-layout",
  THEME: "my-homepage-theme",
};
