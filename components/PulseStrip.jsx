"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient.js";

export default function PulseStrip() {
  const [items, setItems] = useState([]);

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
          { label: "Bugungi leadlar", value: todayLeads },
          { label: "Bugungi sotuvlar", value: todaySales },
          { label: "Target xarajat", value: `${(spend / 1000).toFixed(0)}k` },
          { label: "SMM auditoriya", value: followers.toLocaleString("en-US") },
          { label: "Telegram foydalanuvchi", value: tgActive },
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
  }, []);

  return (
    <div className="border-b border-border bg-panelAlt/60 px-8 py-3 flex items-center gap-8 overflow-x-auto">
      <span className="flex items-center gap-2 text-xs text-textMuted shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-mint pulse-dot" />
        JONLI
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
