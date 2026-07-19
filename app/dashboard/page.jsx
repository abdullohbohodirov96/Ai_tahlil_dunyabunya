"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/apiClient.js";
import StatCard from "../../components/StatCard.jsx";
import { useLanguage } from "../../lib/i18n.js";

export default function OverviewPage() {
  const [sales, setSales] = useState(null);
  const [target, setTarget] = useState(null);
  const [smm, setSmm] = useState(null);
  const [tg, setTg] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    api.salesStats().then(setSales).catch(() => {});
    api.target().then(setTarget).catch(() => {});
    api.smm().then(setSmm).catch(() => {});
    api.tgUsers().then(setTg).catch(() => setTg([]));
  }, []);

  const todayLeads = sales?.daily?.[0]?.leads ?? 0;
  const todaySales = sales?.daily?.[0]?.sales ?? 0;
  const spend = target?.campaigns?.reduce((s, c) => s + Number(c.spend || 0), 0) ?? 0;
  const followers = smm?.platforms?.reduce((s, p) => s + Number(p.followers || 0), 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("overview_title")}</h1>
        <p className="text-textMuted text-sm mt-1">{t("overview_subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("stat_today_leads")} value={todayLeads} />
        <StatCard label={t("stat_today_sales")} value={todaySales} accentColor="text-mint" />
        <StatCard label={t("stat_target_spend")} value={`$${spend.toLocaleString("en-US")}`} />
        <StatCard label={t("stat_smm_audience")} value={followers.toLocaleString("en-US")} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-panel border border-border rounded-xl p-5">
          <h2 className="font-display font-medium mb-3">{t("sales_managers")}</h2>
          <div className="space-y-2">
            {sales?.perManager?.length ? (
              sales.perManager.map((m) => (
                <div key={m.manager_id} className="flex justify-between text-sm border-b border-border/60 py-2 last:border-0">
                  <span>{m.full_name}</span>
                  <span className="font-mono text-textMuted mono-num">
                    {m.total_leads} lead / {m.sales} sotuv
                  </span>
                </div>
              ))
            ) : (
              <p className="text-textMuted text-sm">{t("no_managers")}</p>
            )}
          </div>
        </div>

        <div className="bg-panel border border-border rounded-xl p-5">
          <h2 className="font-display font-medium mb-3">{t("telegram_users")}</h2>
          <p className="text-3xl font-mono mono-num text-accent">{tg.length}</p>
          <p className="text-textMuted text-sm mt-1">
            {tg.filter((u) => u.joined_group).length} {t("joined_group_suffix")}
          </p>
        </div>
      </div>
    </div>
  );
}
