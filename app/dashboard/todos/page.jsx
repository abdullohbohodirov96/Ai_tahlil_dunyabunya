"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, CheckCircle2, CircleDashed, Circle } from "lucide-react";
import { api } from "../../../lib/apiClient.js";
import { useUser } from "../layout.jsx";

const statusMeta = {
  yangi: { label: "Yangi", icon: Circle, cls: "text-textMuted" },
  jarayonda: { label: "Jarayonda", icon: CircleDashed, cls: "text-accent" },
  bajarildi: { label: "Bajarildi", icon: CheckCircle2, cls: "text-mint" },
};

export default function TodosPage() {
  const user = useUser();
  const isAdmin = user.role === "admin" || user.role === "marketing_head";
  const [todos, setTodos] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assignee_id: "", deadline: "" });
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

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
      setOpen(false);
      load();
    } catch (e2) {
      setErr(e2.message);
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

  function deadlineInfo(t) {
    if (!t.deadline) return null;
    const d = new Date(t.deadline);
    const hoursLeft = (d - Date.now()) / 36e5;
    const overdue = hoursLeft < 0 && t.status !== "bajarildi";
    return (
      <span className={`flex items-center gap-1 text-xs ${overdue ? "text-coral" : hoursLeft < 24 ? "text-accent" : "text-textMuted"}`}>
        <Clock size={12} />
        {d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        {overdue && " · muddati o'tgan"}
      </span>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Vazifalar</h1>
          <p className="text-textMuted text-sm mt-1">Deadline'li vazifalar — bot eslatmalari bilan</p>
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

      <div className="space-y-2">
        {todos.map((t) => {
          const S = statusMeta[t.status] || statusMeta.yangi;
          const Icon = S.icon;
          return (
            <div key={t.id} className="bg-panel border border-border rounded-xl p-4 flex items-start gap-3 flex-wrap">
              <Icon size={18} className={`${S.cls} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-[200px]">
                <p className={`font-medium text-sm ${t.status === "bajarildi" ? "line-through text-textMuted" : ""}`}>{t.title}</p>
                {t.description && <p className="text-xs text-textMuted mt-0.5">{t.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-accent">{t.assignee_name || "—"}</span>
                  {deadlineInfo(t)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(t.assignee_id === user.id || isAdmin) && t.status !== "bajarildi" && (
                  <>
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
                  </>
                )}
                {isAdmin && (
                  <button onClick={() => remove(t.id)} className="text-textMuted hover:text-coral p-1 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!todos.length && (
          <p className="text-center text-textMuted text-sm py-10">Hozircha vazifa yo'q.</p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium">Yangi vazifa</h3>
              <button onClick={() => setOpen(false)} className="text-textMuted hover:text-textPrimary">✕</button>
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
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
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
