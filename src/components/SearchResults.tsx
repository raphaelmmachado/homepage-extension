import type { Bookmark } from "../types";
import { BookmarkItem } from "./BookmarkItem";
import { searchOptions } from "../searchEngines";
import * as svgs from "../svgs";
import React from "react";

type Props = {
  searchTerm: string;
  filteredBookmarks: Bookmark[];
  searchResultsRef: React.RefObject<HTMLDivElement | null>;
  handleSearchResultsKeyDown: (e: React.KeyboardEvent) => void;
  openEditBookmark: (bookmark: Bookmark) => void;
  onClickBookmark: (url: string) => void;
};

export function SearchResults({
  searchTerm,
  filteredBookmarks,
  searchResultsRef,
  handleSearchResultsKeyDown,
  openEditBookmark,
  onClickBookmark,
}: Props) {
  if (!searchTerm) return null;

  return (
    <div
      className="container mx-auto p-4 md:px-8 max-w-xl flex-grow"
      onKeyDown={handleSearchResultsKeyDown}
      ref={searchResultsRef}
    >
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400">
            🔍 Sites encontrados
          </h2>
          <div dangerouslySetInnerHTML={{ __html: svgs.tabKeySVG }} />
        </div>
        <div className="flex flex-col gap-1">
          {filteredBookmarks.length > 0 ? (
            <>
              {filteredBookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  layout="list"
                  onEdit={() => openEditBookmark(bookmark)}
                  onClickBookmark={onClickBookmark}
                />
              ))}
            </>
          ) : (
            <>
              <p className="text-center text-sm text-gray-400 dark:text-gray-600 w-full py-4">
                Aperte ENTER para pesquisar ou...
              </p>
              <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                💭 Você quer
              </h2>
              {searchOptions.map((option) => (
                <a
                  key={option.name}
                  href={`${option.url}${encodeURIComponent(searchTerm)}`}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      window.open(
                        `${option.url}${encodeURIComponent(searchTerm)}`,
                        "_blank",
                      );
                    }
                  }}
                  className="flex items-center gap-3 my-1 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div dangerouslySetInnerHTML={{ __html: option.icon }} />
                  <span className="text-gray-700 dark:text-gray-200 text-lg">
                    {option.placeholder.replace("{palavra}", searchTerm)}
                  </span>
                </a>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
