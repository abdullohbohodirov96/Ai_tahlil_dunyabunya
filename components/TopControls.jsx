"use client";

import { useState } from "react";
import { useTheme } from "../lib/theme.js";
import { useLanguage } from "../lib/i18n.js";

const langLabels = { uz: "UZ", ru: "RU", en: "EN" };

export default function TopControls() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          title={t("language")}
          className="bg-panel border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-panelAlt transition-colors"
        >
          {langLabels[lang]}
        </button>
        {open && (
          <div className="absolute right-0 mt-1 bg-panel border border-border rounded-lg overflow-hidden shadow-xl min-w-[80px]">
            {Object.entries(langLabels).map(([code, label]) => (
              <button
                key={code}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-panelAlt transition-colors ${
                  code === lang ? "text-accent" : "text-textPrimary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggleTheme}
        title={t("theme_toggle")}
        className="bg-panel border border-border rounded-lg w-8 h-8 flex items-center justify-center text-sm hover:bg-panelAlt transition-colors"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </div>
  );
}
