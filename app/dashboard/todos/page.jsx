"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Clock, CheckCircle2, CircleDashed, Circle, Sparkles, Loader2 } from "lucide-react";
import { api } from "../../../lib/apiClient.js";
import StatCard from "../../../components/StatCard.jsx";
import { useUser } from "../layout.jsx";

const statusMeta = {
  yangi: { label: "Yangi", icon: Circle, cls: "text-textMuted", col: "border-textMuted/40" },
  jarayonda: { label: "Jarayonda", icon: CircleDashed, cls: "text-accent", col: "border-accent/50" },
  bajarildi: { label: "Bajarildi", icon: CheckCircle2, cls: "text-mint", col: "border-mint/50" },
};

const roleLabels = {
  admin: "Admin",
  marketing_head: "Marketing boshlig'i",
  sales_manager: "Sotuv menejeri",
  smm: "SMM mutaxassisi",
  viewer: "Kuzatuvchi",
};

function TaskCard({ t, user, isAdmin, setStatus, remove }) {
  const S = statusMeta[t.status] || statusMeta.yangi;
  const Icon = S.icon;
  return (
    <div className={`bg-panel border-l-2 ${S.col} border-t border-r border-b border-border rounded-xl p-4 space-y-2`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className={`${S.cls} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${t.status === "bajarildi" ? "line-through text-textMuted" : ""}`}>{t.title}</p>
          {t.description && <p className="text-xs text-textMuted mt-1">{t.description}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => remove(t.id)} className="text-textMuted hover:text-coral p-1 transition-colors shrink-0">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-accent">{t.assignee_name || "—"}</span>
        {t.assignee_role && <span className="text-textMuted">· {roleLabels[t.assignee_role] || t.assignee_role}</span>}
      </div>
      {t.deadline && (
        <DeadlineBadge deadline={t.deadline} status={t.status} />
      )}
      {(t.assignee_id === user.id || isAdmin) && t.status !== "bajarildi" && (
        <div className="flex gap-1.5 pt-1">
          {t.status !== "jarayonda" && (
            <button
              onClick={() => setStatus(t.id, "jarayonda")}
              className="text-xs px-2.5 py-1 rounded border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
            >
              Jarayonda
            </button>
          )}
          <button
            onClick={() => setStatus(t.id, "bajarildi")}
            className="text-xs px-2.5 py-1 rounded border border-mint/40 text-mint hover:bg-mint/10 transition-colors"
          >
            Bajarildi
          </button>
        </div>
      )}
    </div>
  );
}

function DeadlineBadge({ deadline, status }) {
  const d = new Date(deadline);
  const hoursLeft = (d - Date.now()) / 36e5;
  const overdue = hoursLeft < 0 && status !== "bajarildi";
  return (
    <span className={`flex items-center gap-1 text-xs ${overdue ? "text-coral" : hoursLeft < 24 ? "text-accent" : "text-textMuted"}`}>
      <Clock size={12} />
      {d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
      {overdue && " · muddati o'tgan"}
    </span>
  );
}

export default function TodosPage() {
  const user = useUser();
  const isAdmin = user.role === "admin" || user.role === "marketing_head";
  const [todos, setTodos] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assignee_id: "", deadline: "" });
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [polishing, setPolishing] = useState(false);
  const [rawInput, setRawInput] = useState("");

  function load() {
    api.todos().then(setTodos).catch(() => {});
  }

  useEffect(() => {
    load();
    if (isAdmin) api.employees().then(setEmployees).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await api.createTodo({ ...form, deadline: form.deadline || null });
      setForm({ title: "", description: "", assignee_id: "", deadline: "" });
      setRawInput("");
      setOpen(false);
      load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function polishWithAi() {
    if (!rawInput.trim()) return;
    setPolishing(true);
    setErr("");
    try {
      const res = await api.polishTodo(rawInput.trim());
      setForm((f) => ({ ...f, title: res.title, description: res.description }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setPolishing(false);
    }
  }

  async function setStatus(id, status) {
    await api.updateTodo(id, status);
    load();
  }

  async function remove(id) {
    await api.deleteTodo(id);
    load();
  }

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      total: todos.length,
      done: todos.filter((t) => t.status === "bajarildi").length,
      overdue: todos.filter((t) => t.status !== "bajarildi" && t.deadline && new Date(t.deadline) < now).length,
    };
  }, [todos]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Vazifalar</h1>
          <p className="text-textMuted text-sm mt-1">Deadline'li vazifalar — bot orqali tugmali eslatmalar bilan</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="bg-accent text-base font-medium rounded-lg px-4 py-2 text-sm hover:bg-accentDim transition-colors flex items-center gap-2"
          >
            <Plus size={14} />
            Vazifa qo'shish
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami vazifalar" value={counts.total} />
        <StatCard label="Bajarilgan" value={counts.done} accentColor="text-mint" />
        <StatCard label="Muddati o'tgan" value={counts.overdue} accentColor="text-coral" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {["yangi", "jarayonda", "bajarildi"].map((statusKey) => (
          <div key={statusKey} className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-textMuted font-medium">
              {statusMeta[statusKey].label} · {todos.filter((t) => t.status === statusKey).length}
            </p>
            <div className="space-y-2">
              {todos
                .filter((t) => t.status === statusKey)
                .map((t) => (
                  <TaskCard key={t.id} t={t} user={user} isAdmin={isAdmin} setStatus={setStatus} remove={remove} />
                ))}
              {!todos.filter((t) => t.status === statusKey).length && (
                <p className="text-xs text-textMuted italic">Bo'sh</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium">Yangi vazifa</h3>
              <button onClick={() => setOpen(false)} className="text-textMuted hover:text-textPrimary">✕</button>
            </div>

            <div className="bg-panelAlt border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs text-textMuted flex items-center gap-1.5">
                <Sparkles size={13} className="text-accent" />
                Qisqa/qo'pol yozing — AI chiroyli qilib beradi
              </p>
              <div className="flex gap-2">
                <input
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="masalan: ertaga instada 3ta storis qoy"
                  className="flex-1 bg-panel border border-border rounded px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={polishWithAi}
                  disabled={polishing || !rawInput.trim()}
                  className="bg-accent/20 text-accent rounded px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {polishing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Yozish
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                placeholder="Vazifa nomi"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                required
              />
              <textarea
                placeholder="Tavsif (ixtiyoriy)"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm resize-none"
              />
              <select
                value={form.assignee_id}
                onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                required
              >
                <option value="">Mas'ul xodimni tanlang...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} — {roleLabels[emp.role] || emp.role}
                  </option>
                ))}
              </select>
              <div>
                <label className="text-xs text-textMuted">Deadline (ixtiyoriy)</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                />
              </div>
              {err && <p className="text-coral text-xs">{err}</p>}
              <button className="w-full bg-accent rounded-lg py-2 text-sm font-medium hover:bg-accentDim transition-colors">
                Qo'shish va xabar yuborish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
