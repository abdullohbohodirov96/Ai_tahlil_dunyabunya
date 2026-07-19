"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { api } from "../../../lib/apiClient.js";
import StatCard from "../../../components/StatCard.jsx";
import AccessDenied from "../../../components/AccessDenied.jsx";
import { useLanguage } from "../../../lib/i18n.js";
import { usePermissions } from "../../../lib/permissions.js";
import { useUser } from "../layout.jsx";

const ranges = [
  { id: "today", label: "Bugun" },
  { id: "7d", label: "7 kun" },
  { id: "30d", label: "30 kun" },
  { id: "month", label: "Shu oy" },
];

export default function MarketingPage() {
  const [target, setTarget] = useState(null);
  const [smm, setSmm] = useState(null);
  const [range, setRange] = useState("30d");
  const [loadingTarget, setLoadingTarget] = useState(false);
  const { t } = useLanguage();
  const { canView } = usePermissions();
  const user = useUser();
  const isAdmin = user.role === "admin";
  const canTarget = isAdmin || canView("marketing_target");
  const canSmm = isAdmin || canView("marketing_smm");
  const [tab, setTab] = useState(canTarget ? "target" : "smm");

  useEffect(() => {
    if (canSmm) api.smm().then(setSmm).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canTarget) return;
    setLoadingTarget(true);
    api
      .target(range)
      .then(setTarget)
      .catch(() => {})
      .finally(() => setLoadingTarget(false));
  }, [range, canTarget]);

  if (!canTarget && !canSmm) return <AccessDenied />;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("marketing_title")}</h1>
          <p className="text-textMuted text-sm mt-1">{t("marketing_subtitle")}</p>
        </div>
        {tab === "target" && (
          <div className="flex items-center gap-1.5 bg-panel border border-border rounded-lg p-1">
            <Calendar size={14} className="text-textMuted ml-2" />
            {ranges.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  range === r.id ? "bg-accent/15 text-accent" : "text-textMuted hover:text-textPrimary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {[
          canTarget && { id: "target", label: "Target" },
          canSmm && { id: "smm", label: "SMM" },
        ].filter(Boolean).map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === tb.id ? "bg-accent/15 text-accent border-accent/30" : "border-border text-textMuted hover:text-textPrimary"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "target" && (
        <div className="space-y-4">
          {target?.error && (
            <p className="text-xs text-coral bg-coral/10 border border-coral/30 rounded-lg px-4 py-2">
              {target.error}
            </p>
          )}
          {!target?.connected && !target?.error && (
            <p className="text-xs text-textMuted bg-panelAlt border border-border rounded-lg px-4 py-2">
              Meta Ads hali ulanmagan — demo ma'lumot ko'rsatilmoqda. Sozlamalar bo'limida token kiriting.
            </p>
          )}
          <p className="text-xs text-textMuted">Faqat hozir <b>aktiv</b> bo'lgan kampaniyalar ko'rsatilmoqda.</p>

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-opacity ${loadingTarget ? "opacity-50" : ""}`}>
            <StatCard
              label="Jami xarajat"
              value={`$${(target?.campaigns?.reduce((s, c) => s + Number(c.spend), 0) || 0).toLocaleString("en-US")}`}
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
                  <th className="text-left px-4 py-3">Kampaniya (aktiv)</th>
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
                    <td className="px-4 py-3 font-mono mono-num">${Number(c.spend).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.impressions).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.clicks).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num text-mint">{c.leads}</td>
                  </tr>
                ))}
                {!target?.campaigns?.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-textMuted">
                      Hozir aktiv kampaniya topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {target?.daily?.length > 0 && (
            <div className="bg-panel border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-panelAlt text-xs uppercase text-textMuted">Kunlik xarajat</div>
              <table className="w-full text-sm">
                <tbody>
                  {target.daily.map((d) => (
                    <tr key={d.day} className="border-t border-border/60">
                      <td className="px-4 py-2 text-textMuted">{d.day}</td>
                      <td className="px-4 py-2 font-mono mono-num text-right">${Number(d.spend).toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-2 text-xs text-textMuted border-t border-border/60">
                Eslatma: bu — Meta'dan o'qilgan haqiqiy kunlik xarajat. Reklama byudjetini shu yerdan
                to'g'ridan-to'g'ri o'zgartirish hali qo'shilmagan — buni alohida so'rasangiz qo'shib beraman.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "smm" && (
        <div className="space-y-4">
          {smm?.error && (
            <p className="text-xs text-coral bg-coral/10 border border-coral/30 rounded-lg px-4 py-2">
              {smm.error}
            </p>
          )}
          {!smm?.connected && !smm?.error && (
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
