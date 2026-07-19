"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient.js";
import { useLanguage } from "../lib/i18n.js";

export default function PulseStrip() {
  const [items, setItems] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [stats, target, smm, tg] = await Promise.all([
          api.salesStats().catch(() => null),
          api.target().catch(() => null),
          api.smm().catch(() => null),
          api.tgUsers().catch(() => []),
        ]);
        if (!mounted) return;
        const todayLeads = stats?.daily?.[0]?.leads ?? 0;
        const todaySales = stats?.daily?.[0]?.sales ?? 0;
        const spend = target?.campaigns?.reduce((s, c) => s + Number(c.spend || 0), 0) ?? 0;
        const followers = smm?.platforms?.reduce((s, p) => s + Number(p.followers || 0), 0) ?? 0;
        const tgActive = Array.isArray(tg) ? tg.length : 0;

        setItems([
          { label: t("stat_today_leads"), value: todayLeads },
          { label: t("stat_today_sales"), value: todaySales },
          { label: t("stat_target_spend"), value: `${(spend / 1000).toFixed(0)}k` },
          { label: t("stat_smm_audience"), value: followers.toLocaleString("en-US") },
          { label: t("telegram_users"), value: tgActive },
        ]);
      } catch {
        // jim tur
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [t]);

  return (
    <div className="border-b border-border bg-panelAlt/60 px-8 py-3 flex items-center gap-8 overflow-x-auto">
      <span className="flex items-center gap-2 text-xs text-textMuted shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-mint pulse-dot" />
        {t("live")}
      </span>
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-2 shrink-0">
          <span className="font-mono text-sm text-accent mono-num">{it.value}</span>
          <span className="text-xs text-textMuted">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
