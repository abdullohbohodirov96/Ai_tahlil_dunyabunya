"use client";

import { useState } from "react";
import { Sun, Moon, Languages, Check } from "lucide-react";
import { useTheme } from "../lib/theme.js";
import { useLanguage } from "../lib/i18n.js";

const langLabels = { uz: "O'zbek", ru: "Русский", en: "English" };

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
          className="bg-panel/90 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-textPrimary hover:bg-panelAlt transition-all shadow-sm flex items-center gap-1.5"
        >
          <Languages size={14} className="text-accent" />
          {lang.toUpperCase()}
        </button>
        {open && (
          <div className="absolute right-0 mt-1.5 bg-panel border border-border rounded-lg overflow-hidden shadow-xl min-w-[130px]">
            {Object.entries(langLabels).map(([code, label]) => (
              <button
                key={code}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-panelAlt transition-colors flex items-center justify-between ${
                  code === lang ? "text-accent" : "text-textPrimary"
                }`}
              >
                {label}
                {code === lang && <Check size={12} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggleTheme}
        title={t("theme_toggle")}
        className="bg-panel/90 backdrop-blur border border-border rounded-lg w-8 h-8 flex items-center justify-center hover:bg-panelAlt transition-all shadow-sm"
      >
        {theme === "dark" ? (
          <Sun size={15} className="text-accent" />
        ) : (
          <Moon size={15} className="text-accent" />
        )}
      </button>
    </div>
  );
}
