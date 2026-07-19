"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/apiClient.js";
import StatCard from "../../../components/StatCard.jsx";
import AccessDenied from "../../../components/AccessDenied.jsx";
import { useLanguage } from "../../../lib/i18n.js";
import { usePermissions } from "../../../lib/permissions.js";
import { useUser } from "../layout.jsx";

export default function MarketingPage() {
  const [target, setTarget] = useState(null);
  const [smm, setSmm] = useState(null);
  const { t } = useLanguage();
  const { canView } = usePermissions();
  const user = useUser();
  const isAdmin = user.role === "admin";
  const canTarget = isAdmin || canView("marketing_target");
  const canSmm = isAdmin || canView("marketing_smm");
  const [tab, setTab] = useState(canTarget ? "target" : "smm");

  useEffect(() => {
    if (canTarget) api.target().then(setTarget).catch(() => {});
    if (canSmm) api.smm().then(setSmm).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canTarget && !canSmm) return <AccessDenied />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("marketing_title")}</h1>
        <p className="text-textMuted text-sm mt-1">{t("marketing_subtitle")}</p>
      </div>

      <div className="flex gap-2">
        {[
          canTarget && { id: "target", label: "Target" },
          canSmm && { id: "smm", label: "SMM" },
        ].filter(Boolean).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === t.id ? "bg-accent/15 text-accent border-accent/30" : "border-border text-textMuted hover:text-textPrimary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "target" && (
        <div className="space-y-4">
          {!target?.connected && (
            <p className="text-xs text-textMuted bg-panelAlt border border-border rounded-lg px-4 py-2">
              Meta Ads hali ulanmagan — demo ma'lumot ko'rsatilmoqda. Sozlamalar bo'limida token kiriting.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Jami xarajat"
              value={`${(target?.campaigns?.reduce((s, c) => s + Number(c.spend), 0) || 0).toLocaleString("en-US")} so'm`}
            />
            <StatCard
              label="Jami leadlar"
              value={target?.campaigns?.reduce((s, c) => s + Number(c.leads), 0) || 0}
              accentColor="text-mint"
            />
            <StatCard label="Klik" value={target?.campaigns?.reduce((s, c) => s + Number(c.clicks), 0) || 0} />
            <StatCard
              label="Ko'rishlar"
              value={(target?.campaigns?.reduce((s, c) => s + Number(c.impressions), 0) || 0).toLocaleString("en-US")}
            />
          </div>
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-panelAlt text-textMuted text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Kampaniya</th>
                  <th className="text-left px-4 py-3">Xarajat</th>
                  <th className="text-left px-4 py-3">Ko'rishlar</th>
                  <th className="text-left px-4 py-3">Klik</th>
                  <th className="text-left px-4 py-3">Leadlar</th>
                </tr>
              </thead>
              <tbody>
                {target?.campaigns?.map((c, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-4 py-3">{c.name || c.campaign_name}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.spend).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.impressions).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.clicks).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num text-mint">{c.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "smm" && (
        <div className="space-y-4">
          {!smm?.connected && (
            <p className="text-xs text-textMuted bg-panelAlt border border-border rounded-lg px-4 py-2">
              Instagram/SMM hali ulanmagan — demo ma'lumot ko'rsatilmoqda. Sozlamalar bo'limida token kiriting.
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {smm?.platforms?.map((p, i) => (
              <div key={i} className="bg-panel border border-border rounded-xl p-5 space-y-2">
                <h3 className="font-display font-medium">{p.platform}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-textMuted text-xs">Followerlar</span>
                    <p className="font-mono mono-num text-lg">{Number(p.followers).toLocaleString("en-US")}</p>
                  </div>
                  <div>
                    <span className="text-textMuted text-xs">Postlar</span>
                    <p className="font-mono mono-num text-lg">{p.posts}</p>
                  </div>
                  <div>
                    <span className="text-textMuted text-xs">Qamrov (reach)</span>
                    <p className="font-mono mono-num text-lg">{Number(p.reach).toLocaleString("en-US")}</p>
                  </div>
                  <div>
                    <span className="text-textMuted text-xs">Engagement</span>
                    <p className="font-mono mono-num text-lg text-mint">{Number(p.engagement).toLocaleString("en-US")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
