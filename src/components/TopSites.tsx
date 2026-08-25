import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Bookmark } from "../types";
import { BookmarkItem } from "./BookmarkItem";
import * as svgs from "../svgs";

type Props = {
  automaticTopSites: Bookmark[];
  manualTopSites: Bookmark[];
  openEditBookmark: (bookmark: Bookmark) => void;
  onClickBookmark: (id: string) => void;
  openAddBookmark: (containerId: string) => void;
};

export function TopSites({
  automaticTopSites,
  manualTopSites,
  openEditBookmark,
  onClickBookmark,
  openAddBookmark,
}: Props) {
  if (automaticTopSites.length === 0 && manualTopSites.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md mb-6 relative transition-all w-full col-span-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Mais Acessados
        </h2>
      </div>
      <Droppable droppableId="top-sites" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-wrap gap-2 min-h-[50px]"
          >
            {/* Automatic Sites (Not Draggable) */}
            {automaticTopSites.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                layout="grid"
                onEdit={() => openEditBookmark(bookmark)}
                onClickBookmark={onClickBookmark}
              />
            ))}

            {/* Manual Sites (Draggable) */}
            {manualTopSites.map((bookmark, index) => (
              <Draggable
                key={bookmark.id}
                draggableId={bookmark.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <BookmarkItem
                    bookmark={bookmark}
                    layout="grid"
                    onEdit={() => openEditBookmark(bookmark)}
                    onClickBookmark={onClickBookmark}
                    provided={provided}
                    snapshot={snapshot}
                  />
                )}
              </Draggable>
            ))}

            {provided.placeholder}
            <button
              onClick={() => openAddBookmark("top-sites")}
              className={`flex p-2 items-center rounded-xl hover:bg-gray-200/70 dark:hover:bg-gray-700/50 cursor-pointer text-gray-500 transition-all duration-300 flex-col justify-center w-20 ${manualTopSites.length + automaticTopSites.length > 0 ? "opacity-0 hover:opacity-100" : ""}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md border-2 border-dashed border-gray-400 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-600 transition-colors">
                <div
                  dangerouslySetInnerHTML={{ __html: svgs.addIconSVG }}
                />
              </div>
              <span className="mt-2 text-sm">Adicionar</span>
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
