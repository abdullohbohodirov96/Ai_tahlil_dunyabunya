"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/apiClient.js";
import { RefreshCw } from "lucide-react";
import { useUser } from "../layout.jsx";
import StatCard from "../../../components/StatCard.jsx";
import AccessDenied from "../../../components/AccessDenied.jsx";
import { useLanguage } from "../../../lib/i18n.js";
import { usePermissions } from "../../../lib/permissions.js";

const statusLabels = {
  yangi: "Yangi",
  bogliq: "Bog'landi",
  bogliq_emas: "Bog'lanilmadi",
  sifatli: "Sifatli / Sotuv",
  rad: "Rad etildi",
};

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

      {msg && <p className="text-sm text-mint">{msg}</p>}

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
              <th className="text-left px-4 py-3">Holat</th>
              <th className="text-left px-4 py-3">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-border/60">
                <td className="px-4 py-3">{lead.full_name}</td>
                <td className="px-4 py-3 font-mono mono-num">{lead.phone}</td>
                <td className="px-4 py-3 text-textMuted">{lead.source}</td>
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLead(lead.id, { status: e.target.value })}
                    className="bg-panelAlt border border-border rounded px-2 py-1 text-xs"
                  >
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={lead.note || ""}
                    onBlur={(e) => updateLead(lead.id, { note: e.target.value })}
                    placeholder="izoh yozing..."
                    className="bg-transparent border-b border-border focus:border-accent outline-none w-full text-xs py-1"
                  />
                </td>
              </tr>
            ))}
            {!leads.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-textMuted">
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
