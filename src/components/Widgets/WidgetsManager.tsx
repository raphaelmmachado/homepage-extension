import React from "react";

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: "trending-streams",
    name: "Recomendações & Streaming",
    description: "Novidades, títulos aclamados e lançamentos dos principais streamings."
  },
  {
    id: "flamengo-status",
    name: "Status do Flamengo",
    description: "Mostra o próximo jogo e posição nos campeonatos em tempo real."
  },
  {
    id: "ufc-upcoming",
    name: "Próximos Eventos UFC",
    description: "Mostra o próximo evento do UFC, card completo, ranking e lutas principais em tempo real."
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  visibleWidgets: string[];
  toggleWidget: (id: string) => void;
}

export function WidgetsManager({ isOpen, onClose, visibleWidgets, toggleWidget }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-blocks text-gray-600 dark:text-gray-300"><rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/></svg>
            Gerenciar Widgets
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Selecione quais widgets você deseja exibir na sua página inicial:
          </p>
          
          <div className="flex flex-col gap-2.5">
            {AVAILABLE_WIDGETS.map((widget) => {
              const isVisible = visibleWidgets.includes(widget.id);
              return (
                <label 
                  key={widget.id} 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                    isVisible 
                      ? "border-gray-800 dark:border-gray-300 bg-gray-50 dark:bg-gray-700/40" 
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                  }`}
                >
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={isVisible} 
                      onChange={() => toggleWidget(widget.id)}
                      className="w-5 h-5 text-gray-900 dark:text-gray-100 rounded focus:ring-gray-400 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{widget.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{widget.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
