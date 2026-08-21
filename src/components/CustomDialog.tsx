import { useState, useEffect } from "react";

export type DialogConfig = {
  isOpen: boolean;
  type: "alert" | "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
};

export const CustomDialog = ({ dialog }: { dialog: DialogConfig }) => {
  const isPrompt = dialog.type === 'prompt';
  const isConfirm = dialog.type === 'confirm';
  const [inputValue, setInputValue] = useState(dialog.defaultValue || '');

  // Reset inputValue when dialog opens
  useEffect(() => {
    if (dialog.isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog.isOpen, dialog.defaultValue]);

  if (!dialog.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {dialog.title}
        </h3>
        {dialog.message && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
            {dialog.message}
          </p>
        )}

        {isPrompt && (
          <input
            type="text"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 mb-4 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") dialog.onConfirm?.(inputValue);
              if (e.key === "Escape") dialog.onCancel?.();
            }}
          />
        )}

        <div className="flex justify-end gap-2.5 mt-5">
          {(isConfirm || isPrompt) && (
            <button
              onClick={() => dialog.onCancel?.()}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() =>
              dialog.onConfirm?.(isPrompt ? inputValue : undefined)
            }
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
