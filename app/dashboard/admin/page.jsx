"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/apiClient.js";
import { useLanguage } from "../../../lib/i18n.js";

const roleLabels = {
  admin: "Admin",
  marketing_head: "Marketing boshlig'i",
  sales_manager: "Sotuv menejeri",
  smm: "SMM mutaxassisi",
  viewer: "Kuzatuvchi",
};

const modules = [
  { id: "marketing_target", label: "Marketing — Target" },
  { id: "marketing_smm", label: "Marketing — SMM" },
  { id: "sales", label: "Sotuv" },
  { id: "telegram", label: "Telegram" },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ full_name: "", username: "", password: "", role: "sales_manager" });
  const [error, setError] = useState("");
  const [permUser, setPermUser] = useState(null);
  const [perms, setPerms] = useState([]);

  function load() {
    api.employees().then(setEmployees).catch(() => {});
    api.connections().then(setConnections).catch(() => {});
  }

  useEffect(load, []);

  async function addEmployee(e) {
    e.preventDefault();
    setError("");
    try {
      await api.addEmployee(form);
      setForm({ full_name: "", username: "", password: "", role: "sales_manager" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(id, active) {
    await api.updateEmployee(id, { active: !active });
    load();
  }

  async function openPermissions(emp) {
    setPermUser(emp);
    const rows = await api.permissions(emp.id).catch(() => []);
    setPerms(rows);
  }

  function permFor(moduleId) {
    return perms.find((p) => p.module === moduleId) || { can_view: false, can_edit: false };
  }

  async function togglePerm(moduleId, field) {
    const current = permFor(moduleId);
    const next = {
      user_id: permUser.id,
      module: moduleId,
      can_view: field === "can_view" ? !current.can_view : current.can_view,
      can_edit: field === "can_edit" ? !current.can_edit : current.can_edit,
    };
    await api.setPermission(next);
    const rows = await api.permissions(permUser.id);
    setPerms(rows);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("admin_title")}</h1>
        <p className="text-textMuted text-sm mt-1">{t("admin_subtitle")}</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display font-medium text-lg">{t("employees")}</h2>
        <form onSubmit={addEmployee} className="bg-panel border border-border rounded-xl p-5 grid md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="text-xs text-textMuted">To'liq ism</label>
            <input
              className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-textMuted">Login</label>
            <input
              className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-textMuted">Parol</label>
            <input
              type="password"
              className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-textMuted">Rol</label>
            <select
              className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button className="bg-accent rounded px-4 py-2 text-sm font-medium hover:bg-accentDim">Qo'shish</button>
        </form>
        {error && <p className="text-coral text-sm">{error}</p>}

        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-panelAlt text-textMuted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Ism</th>
                <th className="text-left px-4 py-3">Login</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Holat</th>
                <th className="text-left px-4 py-3">Ruxsatlar</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{emp.full_name}</td>
                  <td className="px-4 py-3 text-textMuted">{emp.username}</td>
                  <td className="px-4 py-3">{roleLabels[emp.role] || emp.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(emp.id, emp.active)}
                      className={`text-xs px-3 py-1 rounded ${emp.active ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"}`}
                    >
                      {emp.active ? "Faol" : "Nofaol"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openPermissions(emp)} className="text-xs text-accent hover:underline">
                      Sozlash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {permUser && (
          <div className="bg-panel border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium">{permUser.full_name} — bo'lim ruxsatlari</h3>
              <button onClick={() => setPermUser(null)} className="text-xs text-textMuted hover:text-textPrimary">
                Yopish
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-textMuted text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Bo'lim</th>
                  <th className="text-left py-2">Ko'rish</th>
                  <th className="text-left py-2">Tahrirlash</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const p = permFor(m.id);
                  return (
                    <tr key={m.id} className="border-t border-border/60">
                      <td className="py-2">{m.label}</td>
                      <td className="py-2">
                        <input type="checkbox" checked={!!p.can_view} onChange={() => togglePerm(m.id, "can_view")} />
                      </td>
                      <td className="py-2">
                        <input type="checkbox" checked={!!p.can_edit} onChange={() => togglePerm(m.id, "can_edit")} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display font-medium text-lg">{t("api_connections")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {connections.map((c) => (
            <div key={c.service} className="bg-panel border border-border rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.label}</p>
                <p className="text-xs text-textMuted mt-0.5">
                  {c.connected ? "Ulangan" : "Ulanmagan — Vercel Environment Variables'da token kiriting"}
                </p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${c.connected ? "bg-mint" : "bg-coral"}`} />
            </div>
          ))}
        </div>
        <p className="text-xs text-textMuted">
          Har bir xizmatni ulash uchun Vercel loyihasi → Settings → Environment Variables bo'limida
          tegishli kalitni kiriting (TELEGRAM_BOT_TOKEN, GOOGLE_SERVICE_ACCOUNT_JSON, META_ADS_ACCESS_TOKEN,
          IG_ACCESS_TOKEN) va qayta deploy qiling.
        </p>
      </section>
    </div>
  );
}
