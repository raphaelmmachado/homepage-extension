import { useState } from "react";
import type { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import type { Bookmark, Layout } from "../types";
import { extractFaviconFromURL } from "../helpers";
import * as svgs from "../svgs";

export function BookmarkItem({
  bookmark,
  layout,
  onEdit,
  onClickBookmark,
  provided,
  snapshot,
}: {
  bookmark: Bookmark;
  layout: Layout;
  onEdit: () => void;
  onClickBookmark?: (id: string) => void;
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
}) {
  const defaultFavicon = extractFaviconFromURL(bookmark.url);
  const targetIcon = bookmark.customIcon || defaultFavicon;
  const [hasError, setHasError] = useState(false);
  const [prevTargetIcon, setPrevTargetIcon] = useState(targetIcon);

  if (prevTargetIcon !== targetIcon) {
    setPrevTargetIcon(targetIcon);
    setHasError(false);
  }

  const iconSrc = hasError ? defaultFavicon : targetIcon;

  const handleImageError = () => {
    if (!hasError && targetIcon !== defaultFavicon) {
      setHasError(true);
    }
  };

  const handleClick = () => {
    if (onClickBookmark) onClickBookmark(bookmark.id);
  };

  if (layout === "list") {
    return (
      <div
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={`relative flex items-center group/item p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 ${snapshot?.isDragging ? "opacity-70 bg-gray-200 dark:bg-gray-700 shadow-lg" : ""}`}
      >
        <a
          href={bookmark.url}
          onClick={handleClick}
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              handleClick();
              window.open(bookmark.url, "_blank");
            }
          }}
          className="flex items-center flex-grow"
          title={bookmark.description || ""}
        >
          <img
            src={iconSrc}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            alt={bookmark.name || bookmark.title}
            className="w-6 h-6 object-contain mr-3 rounded"
          />
          <span className="flex-grow text-sm text-gray-700 dark:text-gray-300 break-words">
            {bookmark.name || bookmark.title}
          </span>
        </a>
        <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      className={`relative flex flex-col items-center group/item w-20 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200 ${snapshot?.isDragging ? "opacity-70 bg-gray-200 dark:bg-gray-700 shadow-xl scale-105 z-10" : ""}`}
    >
      <a
        href={bookmark.url}
        onClick={handleClick}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            handleClick();
            window.open(bookmark.url, "_blank");
          }
        }}
        className="flex flex-col items-center p-2"
        title={bookmark.description || ""}
      >
        <img
          src={iconSrc}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          alt={bookmark.name || bookmark.title}
          className="w-7 h-7 object-contain mb-2 rounded-md shadow-sm"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 text-center w-full px-1 break-words whitespace-normal">
          {bookmark.name || bookmark.title}
        </span>
      </a>
      <button
        onClick={onEdit}
        className="absolute top-0 left-0 p-1 text-gray-500 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"
      >
        <div dangerouslySetInnerHTML={{ __html: svgs.ellipsisSVG }} />
      </button>
    </div>
  );
}

