"use client";

import { Lock } from "lucide-react";
import { useLanguage } from "../lib/i18n.js";

export default function AccessDenied() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-panelAlt border border-border flex items-center justify-center">
        <Lock size={20} className="text-textMuted" />
      </div>
      <p className="text-textMuted text-sm max-w-xs">{t("access_denied")}</p>
    </div>
  );
}
