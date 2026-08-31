import { useState } from "react";

export type EmbedType =
  | "brasileirao_standings"
  | "libertadores_groups"
  | "libertadores_bracket"
  | "cdb_bracket";

interface EmbedConfig {
  id: string;
  src: string;
  height: string;
  maxWidth: string;
  scrolling: string;
  attributionText: string;
  attributionUrl: string;
  title: string;
}

const EMBED_CONFIGS: Record<EmbedType, EmbedConfig> = {
  brasileirao_standings: {
    id: "sofa-standings-embed-83-87678",
    src: "https://widgets.sofascore.com/pt-BR/embed/tournament/83/season/87678/standings/Brasileiro%20Serie%20A%202026?widgetTitle=Brasileiro%20Serie%20A%202026&showCompetitionLogo=true",
    height: "1123px",
    maxWidth: "768px",
    scrolling: "no",
    attributionText: "Classificação fornecida por",
    attributionUrl:
      "https://www.sofascore.com/pt/football/tournament/brazil/brasileirao-serie-a/325#id:87678",
    title: "Tabela Completa - Brasileirão Série A",
  },
  libertadores_groups: {
    id: "sofa-standings-embed-2928-87760",
    src: "https://widgets.sofascore.com/pt-BR/embed/tournament/2928/season/87760/standings/CONMEBOL%20Libertadores%202026%2C%20Group%20A?widgetTitle=CONMEBOL%20Libertadores%202026%2C%20Group%20A&showCompetitionLogo=true",
    height: "483px",
    maxWidth: "768px",
    scrolling: "no",
    attributionText: "Classificação fornecida por",
    attributionUrl:
      "https://www.sofascore.com/pt/football/tournament/south-america/copa-libertadores-group-a/384#id:87760",
    title: "Fase de Grupos - CONMEBOL Libertadores",
  },
  libertadores_bracket: {
    id: "sofa-cupTree-embed-384-87760-10859525",
    src: "https://widgets.sofascore.com/pt-BR/embed/unique-tournament/384/season/87760/cuptree/10859525?widgetTitle=CONMEBOL Libertadores 2026, Knockout stage&showCompetitionLogo=true",
    height: "872px",
    maxWidth: "700px",
    scrolling: "yes",
    attributionText: "Estrutura da taça fornecida por",
    attributionUrl:
      "https://www.sofascore.com/pt/football/tournament/south-america/conmebol-libertadores/384#id:87760",
    title: "Chaveamento Mata-Mata - CONMEBOL Libertadores",
  },
  cdb_bracket: {
    id: "sofa-cupTree-embed-373-89353-10846948",
    src: "https://widgets.sofascore.com/pt-BR/embed/unique-tournament/373/season/89353/cuptree/10846948?widgetTitle=Copa do Brasil 2026&showCompetitionLogo=true",
    height: "1272px",
    maxWidth: "700px",
    scrolling: "yes",
    attributionText: "Estrutura da taça fornecida por",
    attributionUrl:
      "https://www.sofascore.com/pt/football/tournament/brazil/copa-do-brasil/373#id:89353",
    title: "Chaveamento Mata-Mata - Copa do Brasil",
  },
};

interface SofascoreEmbedViewProps {
  type: EmbedType;
  onClose?: () => void;
}

export function SofascoreEmbedView({ type, onClose }: SofascoreEmbedViewProps) {
  const config = EMBED_CONFIGS[type];
  const [isDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  if (!config) return null;

  // Ajusta o tema do widget (light/dark) na URL
  const themeParam = "&widgetTheme=" + (isDark ? "dark" : "light");
  const embedSrc = config.src.includes("&widgetTheme=")
    ? config.src.replace(/&widgetTheme=[a-z]+/i, themeParam)
    : config.src + themeParam;

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 sm:p-5 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/70 shadow-sm animate-fadeIn">
      {/* Header do Widget Expandido com Botão de Fechar */}
      <div className="w-full max-w-[768px] flex items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">
            {config.title}
          </h3>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Recolher</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Container Responsivo com iframe oficial do Sofascore */}
      <div
        className="w-full flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900/40 p-2 sm:p-3 border border-gray-100 dark:border-gray-800"
        style={{ maxWidth: config.maxWidth }}
      >
        <div className="w-full relative overflow-hidden" style={{ minHeight: "350px" }}>
          <iframe
            id={config.id}
            src={embedSrc}
            title={config.title}
            height={config.height}
            width="100%"
            scrolling={config.scrolling}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "8px",
            }}
          />
        </div>

        {/* Rodapé de Atribuição Oficial */}
        <div className="w-full text-center text-[10px] text-gray-400 dark:text-gray-500 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          {config.attributionText}{" "}
          <a
            href={config.attributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline font-medium"
          >
            Sofascore
          </a>
        </div>
      </div>
    </div>
  );
}
