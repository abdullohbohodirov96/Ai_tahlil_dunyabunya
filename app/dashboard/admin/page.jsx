"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { api } from "../../../lib/apiClient.js";
import { useLanguage } from "../../../lib/i18n.js";
import SettingField from "../../../components/SettingField.jsx";

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

const emptyPerms = () =>
  modules.reduce((acc, m) => ({ ...acc, [m.id]: { can_view: false, can_edit: false } }), {});

export default function AdminPage() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ full_name: "", username: "", password: "", role: "sales_manager" });
  const [newPerms, setNewPerms] = useState(emptyPerms());
  const [error, setError] = useState("");
  const [permUser, setPermUser] = useState(null);
  const [perms, setPerms] = useState([]);
  const [resetRow, setResetRow] = useState(null);
  const [resetValue, setResetValue] = useState("");
  const [settings, setSettings] = useState({});

  function load() {
    api.employees().then(setEmployees).catch(() => {});
    api.connections().then(setConnections).catch(() => {});
    api.getSettings().then(setSettings).catch(() => {});
  }

  useEffect(load, []);

  async function addEmployee(e) {
    e.preventDefault();
    setError("");
    try {
      const created = await api.addEmployee(form);
      // Xodim yaratilgandan so'ng, tanlangan ruxsatlarni darhol saqlaymiz
      const entries = Object.entries(newPerms).filter(([, v]) => v.can_view || v.can_edit);
      for (const [moduleId, v] of entries) {
        await api.setPermission({ user_id: created.id, module: moduleId, ...v });
      }
      setForm({ full_name: "", username: "", password: "", role: "sales_manager" });
      setNewPerms(emptyPerms());
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleNewPerm(moduleId, field) {
    setNewPerms((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: !prev[moduleId][field] },
    }));
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

  async function submitReset(id) {
    if (!resetValue || resetValue.length < 4) return;
    await api.resetPassword(id, resetValue);
    setResetRow(null);
    setResetValue("");
  }

  async function saveSetting(key, value) {
    await api.updateSetting(key, value);
    load();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("admin_title")}</h1>
        <p className="text-textMuted text-sm mt-1">{t("admin_subtitle")}</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display font-medium text-lg flex items-center gap-2">
          <UserPlus size={18} className="text-accent" />
          {t("employees")}
        </h2>
        <form onSubmit={addEmployee} className="bg-panel border border-border rounded-xl p-5 space-y-4">
          <div className="grid md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="text-xs text-textMuted">To'liq ism</label>
              <input
                className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm focus:border-accent outline-none transition-colors"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-textMuted">Login</label>
              <input
                className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm focus:border-accent outline-none transition-colors"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-textMuted">Parol</label>
              <input
                type="password"
                className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm focus:border-accent outline-none transition-colors"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-textMuted">Rol</label>
              <select
                className="mt-1 w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm focus:border-accent outline-none transition-colors"
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
            <button className="bg-accent rounded px-4 py-2 text-sm font-medium hover:bg-accentDim transition-colors">
              Qo'shish
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-textMuted uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Qaysi bo'limlarga kira olsin? (ixtiyoriy — keyin ham o'zgartirish mumkin)
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {modules.map((m) => (
                <div key={m.id} className="bg-panelAlt border border-border rounded-lg px-3 py-2">
                  <p className="text-xs font-medium mb-1.5">{m.label}</p>
                  <div className="flex gap-3 text-xs text-textMuted">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPerms[m.id].can_view}
                        onChange={() => toggleNewPerm(m.id, "can_view")}
                      />
                      {t("view")}
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPerms[m.id].can_edit}
                        onChange={() => toggleNewPerm(m.id, "can_edit")}
                      />
                      {t("edit")}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                <th className="text-left px-4 py-3">Parol</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-border/60 hover:bg-panelAlt/40 transition-colors">
                  <td className="px-4 py-3">{emp.full_name}</td>
                  <td className="px-4 py-3 text-textMuted">{emp.username}</td>
                  <td className="px-4 py-3">{roleLabels[emp.role] || emp.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(emp.id, emp.active)}
                      className={`text-xs px-3 py-1 rounded transition-colors ${emp.active ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"}`}
                    >
                      {emp.active ? "Faol" : "Nofaol"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openPermissions(emp)} className="text-xs text-accent hover:underline">
                      Sozlash
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {resetRow === emp.id ? (
                      <div className="flex gap-1.5">
                        <input
                          type="password"
                          autoFocus
                          value={resetValue}
                          onChange={(e) => setResetValue(e.target.value)}
                          placeholder="yangi parol"
                          className="bg-panelAlt border border-border rounded px-2 py-1 text-xs w-28"
                        />
                        <button onClick={() => submitReset(emp.id)} className="text-xs text-mint hover:underline">
                          OK
                        </button>
                        <button
                          onClick={() => {
                            setResetRow(null);
                            setResetValue("");
                          }}
                          className="text-xs text-textMuted hover:underline"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResetRow(emp.id)}
                        className="text-xs text-textMuted hover:text-accent flex items-center gap-1"
                      >
                        <KeyRound size={12} />
                        {t("reset_password")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {permUser && (
          <div className="bg-panel border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium">
                {permUser.full_name} — {t("permissions_title")}
              </h3>
              <button onClick={() => setPermUser(null)} className="text-xs text-textMuted hover:text-textPrimary">
                Yopish
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-textMuted text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Bo'lim</th>
                  <th className="text-left py-2">{t("view")}</th>
                  <th className="text-left py-2">{t("edit")}</th>
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
              <p className="font-medium">{c.label}</p>
              <span className={`w-2.5 h-2.5 rounded-full ${c.connected ? "bg-mint" : "bg-coral"}`} />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-panel border border-border rounded-xl p-5 space-y-4">
            <p className="font-medium text-sm">Telegram Bot</p>
            <SettingField
              label="Bot tokeni (@BotFather'dan)"
              dbKey="telegram_bot_token"
              currentInfo={settings.telegram_bot_token}
              onSave={saveSetting}
            />
            <SettingField
              label="Bot username (ixtiyoriy, @ belgisisiz)"
              dbKey="telegram_bot_username"
              currentInfo={settings.telegram_bot_username}
              onSave={saveSetting}
            />
          </div>

          <div className="bg-panel border border-border rounded-xl p-5 space-y-4">
            <p className="font-medium text-sm">Google Sheets</p>
            <SettingField
              label="Service account JSON (to'liq matni)"
              dbKey="google_service_account_json"
              currentInfo={settings.google_service_account_json}
              multiline
              onSave={saveSetting}
            />
            <SettingField
              label="Sheet ID"
              dbKey="google_sheet_id"
              currentInfo={settings.google_sheet_id}
              onSave={saveSetting}
            />
            <SettingField
              label="Range (masalan Leads!A2:F)"
              dbKey="google_sheet_range"
              currentInfo={settings.google_sheet_range}
              onSave={saveSetting}
            />
          </div>

          <div className="bg-panel border border-border rounded-xl p-5 space-y-4">
            <p className="font-medium text-sm">Meta Ads (Target)</p>
            <SettingField
              label="Access token"
              dbKey="meta_ads_access_token"
              currentInfo={settings.meta_ads_access_token}
              onSave={saveSetting}
            />
            <SettingField
              label="Akkaunt ID"
              dbKey="meta_ads_account_id"
              currentInfo={settings.meta_ads_account_id}
              onSave={saveSetting}
            />
          </div>

          <div className="bg-panel border border-border rounded-xl p-5 space-y-4">
            <p className="font-medium text-sm">Instagram (SMM)</p>
            <SettingField
              label="Access token"
              dbKey="ig_access_token"
              currentInfo={settings.ig_access_token}
              onSave={saveSetting}
            />
            <SettingField
              label="Business akkaunt ID"
              dbKey="ig_business_account_id"
              currentInfo={settings.ig_business_account_id}
              onSave={saveSetting}
            />
          </div>

          <div className="bg-panel border border-border rounded-xl p-5 space-y-4 md:col-span-2">
            <p className="font-medium text-sm">AI Assistent</p>
            <SettingField
              label="Anthropic API kaliti"
              dbKey="anthropic_api_key"
              currentInfo={settings.anthropic_api_key}
              onSave={saveSetting}
            />
          </div>
        </div>

        <p className="text-xs text-textMuted">
          Bu yerda kiritilgan qiymatlar darhol ishga tushadi — Vercel'da qayta deploy qilish shart emas.
        </p>
      </section>
    </div>
  );
}
