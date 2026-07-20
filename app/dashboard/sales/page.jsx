"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { RefreshCw, ChevronDown, Search, LayoutGrid, List, Download, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useUser } from "../layout.jsx";
import StatCard from "../../../components/StatCard.jsx";
import AccessDenied from "../../../components/AccessDenied.jsx";
import LeadDetail, { contactOptions, qualityOptions } from "../../../components/LeadDetail.jsx";
import { useLanguage } from "../../../lib/i18n.js";
import { usePermissions } from "../../../lib/permissions.js";
import { api } from "../../../lib/apiClient.js";

function stageOf(lead) {
  if (lead.sold) return "sold";
  if (lead.contact_status === "yoq" || lead.contact_status === "kotarmadi") return "lost";
  if (lead.contact_status === "ha" || lead.contact_status === "ochiq") return "progress";
  return "new";
}

const stages = [
  { id: "new", label: "Yangi", color: "border-textMuted/40" },
  { id: "progress", label: "Jarayonda", color: "border-accent/50" },
  { id: "lost", label: "Yo'qotilgan", color: "border-coral/50" },
  { id: "sold", label: "Sotildi", color: "border-mint/50" },
];

function isOverdue(lead) {
  if (!lead.follow_up_date || lead.sold) return false;
  const today = new Date().toISOString().slice(0, 10);
  return lead.follow_up_date.slice(0, 10) <= today;
}

function exportCsv(leads) {
  const header = ["Ism", "Telefon", "Manba", "Bog'lanish", "Sifat", "Qayta aloqa", "Izoh", "Sotildi", "Summa"];
  const rows = leads.map((l) => [
    l.full_name,
    l.phone,
    l.source,
    l.contact_status || "",
    l.quality || "",
    l.follow_up_date ? l.follow_up_date.slice(0, 10) : "",
    (l.note || "").replace(/\n/g, " ").replace(/,/g, ";"),
    l.sold ? "Ha" : "Yo'q",
    l.sale_amount || "",
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leadlar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SalesPage() {
  const user = useUser();
  const { t } = useLanguage();
  const { canView, canEdit } = usePermissions();
  const hasAccess = user.role === "admin" || user.role === "sales_manager" || canView("sales");
  const canSync = user.role === "admin" || user.role === "marketing_head" || canEdit("sales");
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [board, setBoard] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [modalLead, setModalLead] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", source: "" });
  const [managers, setManagers] = useState([]);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    const l = await api.leads().catch(() => []);
    setLeads(l);
    if (user.role !== "sales_manager") {
      api.salesStats().then(setStats).catch(() => {});
      api.leaderboard().then(setBoard).catch(() => {});
    }
  }

  useEffect(() => {
    load();
    if (user.role === "admin") {
      api.employees().then((emps) => setManagers(emps.filter((e) => e.role === "sales_manager"))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSync() {
    setSyncing(true);
    setMsg("");
    try {
      const res = await api.syncSheet();
      setMsg(`Sheetdan ${res.synced} qator o'qildi: ${res.added} ta yangi, ${res.updated} ta yangilandi.`);
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

  async function submitAddLead(e) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      await api.createLead(addForm);
      setAddForm({ full_name: "", phone: "", source: "" });
      setAddModalOpen(false);
      load();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        if (!(l.full_name?.toLowerCase().includes(q) || l.phone?.includes(q))) return false;
      }
      if (qualityFilter && l.quality !== qualityFilter) return false;
      if (statusFilter === "sotilgan" && !l.sold) return false;
      if (statusFilter === "sotilmagan" && l.sold) return false;
      if (statusFilter === "qayta_aloqa" && !l.follow_up_date) return false;
      if (fromDate && new Date(l.created_at) < new Date(fromDate)) return false;
      if (toDate && new Date(l.created_at) > new Date(toDate + "T23:59:59")) return false;
      return true;
    });
  }, [leads, search, qualityFilter, statusFilter, fromDate, toDate]);

  const overdueCount = leads.filter(isOverdue).length;

  if (!hasAccess) return <AccessDenied />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("sales_title")}</h1>
          <p className="text-textMuted text-sm mt-1">{t("sales_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-panel border border-border rounded-lg px-3 py-2 text-xs font-medium hover:bg-panelAlt transition-colors flex items-center gap-1.5"
          >
            <Plus size={13} />
            Lead qo'shish
          </button>
          <button
            onClick={() => exportCsv(filteredLeads)}
            className="bg-panel border border-border rounded-lg px-3 py-2 text-xs font-medium hover:bg-panelAlt transition-colors flex items-center gap-1.5"
          >
            <Download size={13} />
            CSV
          </button>
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
      </div>

      {msg && <p className={`text-sm ${msg.includes("xatosi") ? "text-coral" : "text-mint"}`}>{msg}</p>}

      {overdueCount > 0 && (
        <div className="bg-coral/10 border border-coral/30 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-coral">
          <AlertCircle size={15} />
          {overdueCount} ta lead bilan bugun yoki undan oldin qayta aloqa qilish belgilangan edi.
        </div>
      )}

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

      {board && board.board?.length > 0 && (
        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-panelAlt flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs uppercase text-textMuted font-medium">Leaderboard · Oylik & KPI</span>
            <span className="text-xs text-textMuted">
              Jami: {Number(board.overall.total_sales).toLocaleString("en-US")} so'm · {board.overall.total_count} sotuv
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-panelAlt/60 text-textMuted text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Menejer</th>
                  <th className="text-right px-4 py-2">Sotuvlar</th>
                  <th className="text-right px-4 py-2">Summa (so'm)</th>
                  <th className="text-right px-4 py-2">Oylik (fix)</th>
                  <th className="text-right px-4 py-2">KPI bonus</th>
                  <th className="text-right px-4 py-2">Jami oylik</th>
                  <th className="text-right px-4 py-2">Keyingi KPI'gacha</th>
                </tr>
              </thead>
              <tbody>
                {board.board.map((b, i) => (
                  <tr key={b.id} className="border-t border-border/60">
                    <td className="px-4 py-2.5">{i + 1}</td>
                    <td className="px-4 py-2.5">{b.full_name}</td>
                    <td className="px-4 py-2.5 text-right font-mono mono-num">{b.sales_count}</td>
                    <td className="px-4 py-2.5 text-right font-mono mono-num text-mint">{b.sales_total.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2.5 text-right font-mono mono-num">{b.base_salary.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2.5 text-right font-mono mono-num text-accent">{b.kpi_bonus.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2.5 text-right font-mono mono-num font-medium">{b.projected_salary.toLocaleString("en-US")}</td>
                    <td className="px-4 py-2.5 text-right font-mono mono-num text-textMuted">{b.next_kpi_in.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2 text-xs text-textMuted border-t border-border/60">
            KPI qoidasi: minimal 50 mln so'm sotuv, undan keyin har 50 mln uchun 500 000 so'm bonus.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="w-full bg-panel border border-border rounded-lg pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={qualityFilter}
          onChange={(e) => setQualityFilter(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Barcha sifatlar</option>
          {qualityOptions.map((q) => (
            <option key={q.id} value={q.id}>{q.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Barcha holatlar</option>
          <option value="sotilgan">Sotilganlar</option>
          <option value="sotilmagan">Sotilmaganlar</option>
          <option value="qayta_aloqa">Qayta aloqa belgilanganlar</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm" title="Boshlanish sanasi" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm" title="Tugash sanasi" />
        <div className="flex gap-1 bg-panel border border-border rounded-lg p-1 ml-auto">
          <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded transition-colors ${view === "table" ? "bg-accent/15 text-accent" : "text-textMuted"}`}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`p-1.5 rounded transition-colors ${view === "kanban" ? "bg-accent/15 text-accent" : "text-textMuted"}`}
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {view === "table" ? (
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
              {filteredLeads.map((lead) => {
                const ContactIcon = contactOptions.find((c) => c.id === lead.contact_status)?.icon;
                const isOpen = expandedId === lead.id;
                return (
                  <Fragment key={lead.id}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : lead.id)}
                      className={`border-t border-border/60 cursor-pointer hover:bg-panelAlt/40 transition-colors ${
                        isOverdue(lead) ? "bg-coral/5" : ""
                      }`}
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
                          <span className="text-xs text-mint">
                            Sotildi{lead.sale_amount ? ` · ${Number(lead.sale_amount).toLocaleString("en-US")} so'm` : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-textMuted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canSync && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm("Bu leadni o'chirasizmi?")) { api.deleteLead(lead.id).then(load); } }}
                            className="text-textMuted hover:text-coral mr-2 align-middle"
                            title="O'chirish"
                          >
                            <Trash2 size={14} className="inline" />
                          </button>
                        )}
                        <ChevronDown size={16} className={`text-textMuted transition-transform inline-block ${isOpen ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-panelAlt/30 border-t border-border/60">
                        <td colSpan={6} className="px-4 py-5">
                          <LeadDetail lead={lead} onSave={updateLead} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!filteredLeads.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-textMuted">
                    Hech narsa topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <div key={stage.id} className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-textMuted font-medium">{stage.label}</p>
              <div className="space-y-2">
                {filteredLeads
                  .filter((l) => stageOf(l) === stage.id)
                  .map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setModalLead(lead)}
                      className={`w-full text-left bg-panel border-l-2 ${stage.color} border-t border-r border-b border-border rounded-lg p-3 hover:bg-panelAlt/40 transition-colors ${
                        isOverdue(lead) ? "ring-1 ring-coral/40" : ""
                      }`}
                    >
                      <p className="text-sm font-medium">{lead.full_name}</p>
                      <p className="text-xs text-textMuted font-mono mono-num">{lead.phone}</p>
                      {lead.quality && (
                        <span className="inline-block mt-1.5 text-xs text-accent bg-accent/10 rounded px-1.5 py-0.5">
                          {qualityOptions.find((q) => q.id === lead.quality)?.label}
                        </span>
                      )}
                    </button>
                  ))}
                {!filteredLeads.filter((l) => stageOf(l) === stage.id).length && (
                  <p className="text-xs text-textMuted italic">Bo'sh</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {addModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium">Yangi lead qo'shish</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-textMuted hover:text-textPrimary">✕</button>
            </div>
            <form onSubmit={submitAddLead} className="space-y-3">
              <input
                placeholder="To'liq ism"
                value={addForm.full_name}
                onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                required
              />
              <input
                placeholder="Telefon raqami"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                required
              />
              <input
                placeholder="Manba (masalan: Qo'ng'iroq, Do'kon)"
                value={addForm.source}
                onChange={(e) => setAddForm((f) => ({ ...f, source: e.target.value }))}
                className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
              />
              {user.role === "admin" && managers.length > 0 && (
                <select
                  value={addForm.manager_id || ""}
                  onChange={(e) => setAddForm((f) => ({ ...f, manager_id: e.target.value }))}
                  className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Avtomatik menejer tanlansin</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              )}
              {addError && <p className="text-coral text-xs">{addError}</p>}
              <button
                disabled={adding}
                className="w-full bg-accent text-base font-medium rounded-lg py-2 text-sm hover:bg-accentDim transition-colors disabled:opacity-50"
              >
                {adding ? "Qo'shilmoqda..." : "Qo'shish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-medium">{modalLead.full_name}</h3>
                <p className="text-xs text-textMuted font-mono mono-num">{modalLead.phone} · {modalLead.source}</p>
              </div>
              <button onClick={() => setModalLead(null)} className="text-textMuted hover:text-textPrimary">✕</button>
            </div>
            <LeadDetail
              lead={modalLead}
              onSave={async (id, patch) => {
                await updateLead(id, patch);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
