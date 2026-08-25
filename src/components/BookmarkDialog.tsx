import { useState } from "react";
import type { Bookmark } from "../types";
import { extractFaviconFromURL } from "../helpers";

type Props = {
  isOpen: boolean;
  editingBookmark: Bookmark | null;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
};

function BookmarkDialogContent({
  editingBookmark,
  onSave,
  onDelete,
  onClose,
}: Omit<Props, "isOpen">) {
  const [url, setUrl] = useState(editingBookmark?.url || "");
  const [customIcon, setCustomIcon] = useState(
    editingBookmark?.customIcon || "",
  );
  const [previewError, setPreviewError] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleCustomIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setPreviewError(false);
    setSizeError(null);

    // Proteção contra imagens pesadas (ex: Base64 gigante > 50KB)
    if (val.startsWith("data:image/") && val.length > 65536) {
      setSizeError(
        "Imagem em base64 muito pesada (> 50KB). Insira o link da imagem.",
      );
      return;
    }

    setCustomIcon(val);
  };

  const defaultFavicon = extractFaviconFromURL(url || "https://google.com");
  const activeIconSrc =
    customIcon && !previewError ? customIcon : defaultFavicon;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (sizeError) {
      e.preventDefault();
      return;
    }
    onSave(e);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {editingBookmark ? "Editar Favorito" : "Adicionar Novo Favorito"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Site
            </label>
            <input
              type="text"
              name="title"
              defaultValue={
                editingBookmark?.name || editingBookmark?.title || ""
              }
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Ex: Google"
            />
          </div>

          <div className="mb-3.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link (URL)
            </label>
            <input
              type="text"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Ex: google.com"
            />
          </div>

          <div className="mb-3.5">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ícone Customizado
              </label>
              {customIcon && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomIcon("");
                    setPreviewError(false);
                    setSizeError(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Restaurar padrão
                </button>
              )}
            </div>
            <input
              type="text"
              name="customIcon"
              value={customIcon}
              onChange={handleCustomIconChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="OPCIONAL: Link da imagem (https://...)"
            />
            {sizeError && (
              <p className="text-xs text-red-500 mt-1">{sizeError}</p>
            )}

            {/* Preview do Ícone */}
            <div className="mt-2.5 flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-1 shrink-0">
                <img
                  src={activeIconSrc}
                  alt="Prévia do Ícone"
                  onError={() => setPreviewError(true)}
                  className="w-6 h-6 object-contain rounded"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {customIcon && !previewError
                    ? "Ícone personalizado ativo"
                    : "Favicon automático do site"}
                </p>
                {previewError && customIcon && (
                  <p className="text-red-500 mt-0.5">
                    Não foi possível carregar a imagem do link (usando favicon padrão).
                  </p>
                )}
                {!previewError && (
                  <p className="mt-0.5">
                    {customIcon
                      ? "Dimensão recomendada: 1:1 (PNG, SVG, WebP)"
                      : "Cole uma URL acima para personalizar."}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              name="description"
              defaultValue={editingBookmark?.description || ""}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="OPCIONAL: Breve descrição do site"
            />
          </div>

          <div className="flex justify-end space-x-2.5 pt-1">
            {editingBookmark && (
              <button
                type="button"
                onClick={onDelete}
                className="bg-red-600 text-white font-medium py-2 px-3.5 rounded-xl hover:bg-red-700 transition-colors mr-auto text-sm shadow-sm"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!!sizeError}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 shadow-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BookmarkDialog(props: Props) {
  if (!props.isOpen) return null;
  return (
    <BookmarkDialogContent
      key={props.editingBookmark?.id || "new"}
      editingBookmark={props.editingBookmark}
      onSave={props.onSave}
      onDelete={props.onDelete}
      onClose={props.onClose}
    />
  );
}


