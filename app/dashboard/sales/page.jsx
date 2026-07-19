"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ChevronDown, Phone, PhoneOff, PhoneMissed, CircleDot } from "lucide-react";
import { useUser } from "../layout.jsx";
import StatCard from "../../../components/StatCard.jsx";
import AccessDenied from "../../../components/AccessDenied.jsx";
import { useLanguage } from "../../../lib/i18n.js";
import { usePermissions } from "../../../lib/permissions.js";
import { api } from "../../../lib/apiClient.js";

const contactOptions = [
  { id: "ha", label: "Ha", icon: Phone, color: "text-mint" },
  { id: "yoq", label: "Yo'q", icon: PhoneOff, color: "text-coral" },
  { id: "kotarmadi", label: "Ko'tarmadi", icon: PhoneMissed, color: "text-accent" },
  { id: "ochiq", label: "Ochiq tel", icon: CircleDot, color: "text-textMuted" },
];

const qualityOptions = [
  { id: "issiq", label: "Issiq" },
  { id: "iliq", label: "Iliq" },
  { id: "sovuq", label: "Sovuq" },
];

function LeadRow({ lead, onSave }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    contact_status: lead.contact_status || "",
    quality: lead.quality || "",
    follow_up_date: lead.follow_up_date ? lead.follow_up_date.slice(0, 10) : "",
    note: lead.note || "",
    sold: lead.sold || false,
    sale_amount: lead.sale_amount || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(lead.id, {
        ...form,
        sale_amount: form.sale_amount ? Number(form.sale_amount) : null,
        follow_up_date: form.follow_up_date || null,
      });
    } finally {
      setSaving(false);
    }
  }

  const ContactIcon = contactOptions.find((c) => c.id === lead.contact_status)?.icon;

  return (
    <>
      <tr
        onClick={() => setOpen((o) => !o)}
        className="border-t border-border/60 cursor-pointer hover:bg-panelAlt/40 transition-colors"
      >
        <td className="px-4 py-3">{lead.full_name}</td>
        <td className="px-4 py-3 font-mono mono-num">{lead.phone}</td>
        <td className="px-4 py-3 text-textMuted">{lead.source}</td>
        <td className="px-4 py-3">
          {ContactIcon ? (
            <span className={`flex items-center gap-1 text-xs ${contactOptions.find((c) => c.id === lead.contact_status)?.color}`}>
              <ContactIcon size={13} />
              {contactOptions.find((c) => c.id === lead.contact_status)?.label}
            </span>
          ) : (
            <span className="text-xs text-textMuted">Belgilanmagan</span>
          )}
        </td>
        <td className="px-4 py-3">
          {lead.sold ? (
            <span className="text-xs text-mint">Sotildi{lead.sale_amount ? ` · $${Number(lead.sale_amount).toLocaleString("en-US")}` : ""}</span>
          ) : (
            <span className="text-xs text-textMuted">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <ChevronDown size={16} className={`text-textMuted transition-transform inline-block ${open ? "rotate-180" : ""}`} />
        </td>
      </tr>
      {open && (
        <tr className="bg-panelAlt/30 border-t border-border/60">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wide">Bog'lanildimi?</label>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {contactOptions.map((c) => {
                      const Icon = c.icon;
                      const active = form.contact_status === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setForm((f) => ({ ...f, contact_status: c.id }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            active ? "bg-accent/15 border-accent/40 text-accent" : "border-border text-textMuted hover:text-textPrimary"
                          }`}
                        >
                          <Icon size={13} />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wide">Lead sifati</label>
                  <div className="flex gap-2 mt-1.5">
                    {qualityOptions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setForm((f) => ({ ...f, quality: q.id }))}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          form.quality === q.id ? "bg-accent/15 border-accent/40 text-accent" : "border-border text-textMuted hover:text-textPrimary"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wide">Qayta aloqa sanasi</label>
                  <input
                    type="date"
                    value={form.follow_up_date}
                    onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
                    className="mt-1.5 w-full bg-panel border border-border rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-textMuted uppercase tracking-wide">Izoh</label>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="mijoz haqida izoh..."
                    className="mt-1.5 w-full bg-panel border border-border rounded px-2 py-1.5 text-sm resize-none"
                  />
                </div>

                <div className="flex items-end gap-3">
                  <div>
                    <label className="text-xs text-textMuted uppercase tracking-wide">Sotildimi?</label>
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => setForm((f) => ({ ...f, sold: true }))}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          form.sold ? "bg-mint/15 border-mint/40 text-mint" : "border-border text-textMuted"
                        }`}
                      >
                        Ha
                      </button>
                      <button
                        onClick={() => setForm((f) => ({ ...f, sold: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          !form.sold ? "bg-coral/15 border-coral/40 text-coral" : "border-border text-textMuted"
                        }`}
                      >
                        Yo'q
                      </button>
                    </div>
                  </div>
                  {form.sold && (
                    <div className="flex-1">
                      <label className="text-xs text-textMuted uppercase tracking-wide">Summa ($)</label>
                      <input
                        type="number"
                        value={form.sale_amount}
                        onChange={(e) => setForm((f) => ({ ...f, sale_amount: e.target.value }))}
                        placeholder="0"
                        className="mt-1.5 w-full bg-panel border border-border rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-accent text-base font-medium rounded-lg py-2 text-sm hover:bg-accentDim transition-colors disabled:opacity-50"
                >
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SalesPage() {
  const user = useUser();
  const { t } = useLanguage();
  const { canView, canEdit } = usePermissions();
  const hasAccess = user.role === "admin" || user.role === "sales_manager" || canView("sales");
  const canSync = user.role === "admin" || user.role === "marketing_head" || canEdit("sales");
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const l = await api.leads().catch(() => []);
    setLeads(l);
    if (user.role !== "sales_manager") {
      api.salesStats().then(setStats).catch(() => {});
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSync() {
    setSyncing(true);
    setMsg("");
    try {
      const res = await api.syncSheet();
      setMsg(`Sheetdan ${res.synced} qator o'qildi, ${res.added} ta yangi lead qo'shildi.`);
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSyncing(false);
    }
  }

  async function updateLead(id, patch) {
    await api.updateLead(id, patch);
    load();
  }

  if (!hasAccess) return <AccessDenied />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("sales_title")}</h1>
          <p className="text-textMuted text-sm mt-1">{t("sales_subtitle")}</p>
        </div>
        {canSync && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-accent text-base font-medium rounded-lg px-4 py-2 text-sm hover:bg-accentDim disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? t("syncing") : t("sync_sheet")}
          </button>
        )}
      </div>

      {msg && <p className={`text-sm ${msg.includes("xatosi") ? "text-coral" : "text-mint"}`}>{msg}</p>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.perManager.map((m) => (
            <StatCard
              key={m.manager_id}
              label={m.full_name}
              value={`${m.total_leads} lead`}
              sub={`${m.sales} sotuv · ${m.no_contact} bog'lanmagan`}
            />
          ))}
        </div>
      )}

      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-panelAlt text-textMuted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Ism</th>
              <th className="text-left px-4 py-3">Telefon</th>
              <th className="text-left px-4 py-3">Manba</th>
              <th className="text-left px-4 py-3">Bog'lanish</th>
              <th className="text-left px-4 py-3">Natija</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onSave={updateLead} />
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-textMuted">
                  Hozircha lead yo'q. "Sheetdan yangilash" tugmasini bosing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
