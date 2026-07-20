"use client";

import { useEffect, useState } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  const [smmHistory, setSmmHistory] = useState([]);
  const [smmPlatform, setSmmPlatform] = useState("instagram");
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
    if (canSmm) api.smm(smmPlatform, range).then(setSmm).catch(() => {});
    if (canSmm) api.smmHistory(smmPlatform).then(setSmmHistory).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smmPlatform, range, canSmm]);

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
        {(tab === "target" || tab === "smm") && (
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
              label="Jami natijalar (lead/qo'ng'iroq/xabar)"
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
                  <th className="text-left px-4 py-3">Natija</th>
                </tr>
              </thead>
              <tbody>
                {target?.campaigns?.map((c, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-4 py-3">{c.name || c.campaign_name}</td>
                    <td className="px-4 py-3 font-mono mono-num">${Number(c.spend).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.impressions).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num">{Number(c.clicks).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 font-mono mono-num text-mint text-xs">
                      {c.resultsText}
                    </td>
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
          <div className="flex gap-2">
            {[
              { id: "instagram", label: "Instagram" },
              { id: "facebook", label: "Facebook" },
            ].map((pf) => (
              <button
                key={pf.id}
                onClick={() => setSmmPlatform(pf.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  smmPlatform === pf.id ? "bg-accent/15 text-accent border-accent/30" : "border-border text-textMuted hover:text-textPrimary"
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
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
          {smmHistory.length > 1 && (
            <div className="bg-panel border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-medium text-sm flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-mint" />
                  Obunachilar o'sishi
                </h3>
                {(() => {
                  const first = smmHistory[0]?.followers;
                  const last = smmHistory[smmHistory.length - 1]?.followers;
                  const delta = last != null && first != null ? last - first : null;
                  if (delta == null) return null;
                  return (
                    <span className={`text-xs font-mono mono-num ${delta >= 0 ? "text-mint" : "text-coral"}`}>
                      {delta >= 0 ? "+" : ""}{delta.toLocaleString("en-US")} ({smmHistory.length} kun)
                    </span>
                  );
                })()}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={smmHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--color-textMuted))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--color-textMuted))" }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))", fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="followers" stroke="rgb(var(--color-mint))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {smmHistory.length <= 1 && (
            <p className="text-xs text-textMuted">
              O'sish grafigi kunlik snapshot to'planishi bilan (bir necha kundan keyin) ko'rina boshlaydi.
            </p>
          )}

          {isAdmin && <ContentPlanSection />}
        </div>
      )}
    </div>
  );
}

function ContentPlanSection() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ day: "", stories_count: 0, posts_count: 0, carousels_count: 0, note: "" });
  const [msg, setMsg] = useState("");

  function load() {
    api.contentPlan(month).then(setPlans).catch(() => {});
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.saveContentPlan(form);
      setForm({ day: "", stories_count: 0, posts_count: 0, carousels_count: 0, note: "" });
      setMsg("Saqlandi");
      load();
    } catch (e2) {
      setMsg(e2.message);
    }
  }

  return (
    <div className="bg-panel border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display font-medium text-sm">Oylik kontent-reja</h3>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-panelAlt border border-border rounded px-2 py-1 text-xs"
        />
      </div>

      <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
        <div>
          <label className="text-xs text-textMuted">Sana</label>
          <input type="date" required value={form.day}
            onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
            className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="text-xs text-textMuted">Storis</label>
          <input type="number" min="0" value={form.stories_count}
            onChange={(e) => setForm((f) => ({ ...f, stories_count: Number(e.target.value) }))}
            className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="text-xs text-textMuted">Post</label>
          <input type="number" min="0" value={form.posts_count}
            onChange={(e) => setForm((f) => ({ ...f, posts_count: Number(e.target.value) }))}
            className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="text-xs text-textMuted">Carousel</label>
          <input type="number" min="0" value={form.carousels_count}
            onChange={(e) => setForm((f) => ({ ...f, carousels_count: Number(e.target.value) }))}
            className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="text-xs text-textMuted">Izoh</label>
          <input value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-xs" />
        </div>
        <button className="bg-accent/20 text-accent rounded px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors">
          Saqlash
        </button>
      </form>
      {msg && <p className={`text-xs ${msg === "Saqlandi" ? "text-mint" : "text-coral"}`}>{msg}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-textMuted uppercase">
            <tr>
              <th className="text-left py-2">Sana</th>
              <th className="text-right py-2">Storis</th>
              <th className="text-right py-2">Post</th>
              <th className="text-right py-2">Carousel</th>
              <th className="text-left py-2 pl-4">Izoh</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((pl) => (
              <tr key={pl.id} className="border-t border-border/60">
                <td className="py-2">{pl.day?.slice(0, 10)}</td>
                <td className="py-2 text-right font-mono mono-num">{pl.stories_count}</td>
                <td className="py-2 text-right font-mono mono-num">{pl.posts_count}</td>
                <td className="py-2 text-right font-mono mono-num">{pl.carousels_count}</td>
                <td className="py-2 pl-4 text-textMuted">{pl.note || ""}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => api.deleteContentPlan(pl.day?.slice(0, 10)).then(load)}
                    className="text-textMuted hover:text-coral"
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
            {!plans.length && (
              <tr><td colSpan={6} className="py-4 text-center text-textMuted">Bu oy uchun reja kiritilmagan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-textMuted">
        Har kuni ertalab bot shu kunga belgilangan rejani SMM roli bog'langan xodimlarga avtomatik eslatadi.
      </p>
    </div>
  );
}
