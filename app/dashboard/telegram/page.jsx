"use client";

import { useEffect, useState } from "react";
import { UserPlus2 } from "lucide-react";
import { api } from "../../../lib/apiClient.js";
import { useLanguage } from "../../../lib/i18n.js";
import { usePermissions } from "../../../lib/permissions.js";
import { useUser } from "../layout.jsx";
import AccessDenied from "../../../components/AccessDenied.jsx";
import StatCard from "../../../components/StatCard.jsx";

const roleLabels = {
  admin: "Admin",
  marketing_head: "Marketing boshlig'i",
  sales_manager: "Sotuv menejeri",
  smm: "SMM mutaxassisi",
  viewer: "Kuzatuvchi",
};

export default function TelegramPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [taskDraft, setTaskDraft] = useState({});
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [existingEmployees, setExistingEmployees] = useState([]);
  const [roleForm, setRoleForm] = useState({ full_name: "", username: "", password: "", role: "sales_manager" });
  const [linkExistingId, setLinkExistingId] = useState("");
  const [roleError, setRoleError] = useState("");
  const { t } = useLanguage();
  const { canView } = usePermissions();
  const user = useUser();
  const hasAccess = user.role === "admin" || user.role === "marketing_head" || canView("telegram");

  async function load() {
    let query = "";
    if (filter === "started") query = "?started=true";
    if (filter === "joined") query = "?joined=true";
    const rows = await api.tgUsers(query).catch(() => []);
    setUsers(rows);
  }

  useEffect(() => {
    load();
    if (user.role === "admin") api.employees().then(setExistingEmployees).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function assign(userId) {
    const title = taskDraft[userId];
    if (!title) return;
    await api.assignTask(userId, title);
    setTaskDraft((d) => ({ ...d, [userId]: "" }));
  }

  function openRoleModal(u) {
    setRoleModalUser(u);
    setRoleForm({ full_name: u.first_name || "", username: "", password: "", role: "sales_manager" });
    setLinkExistingId("");
    setRoleError("");
  }

  async function submitCreateEmployee(e) {
    e.preventDefault();
    setRoleError("");
    try {
      await api.createEmployeeFromTg(roleModalUser.id, roleForm);
      setRoleModalUser(null);
      load();
    } catch (err) {
      setRoleError(err.message);
    }
  }

  async function submitLinkExisting() {
    if (!linkExistingId) return;
    await api.linkExistingEmployee(roleModalUser.id, linkExistingId);
    setRoleModalUser(null);
    load();
  }

  if (!hasAccess) return <AccessDenied />;

  const startedCount = users.filter((u) => u.started_bot).length;
  const joinedCount = users.filter((u) => u.joined_group).length;
  const linkedCount = users.filter((u) => u.linked_user_id).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("telegram_title")}</h1>
        <p className="text-textMuted text-sm mt-1">{t("telegram_subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Jami foydalanuvchi" value={users.length} />
        <StatCard label="/start bosganlar" value={startedCount} accentColor="text-mint" />
        <StatCard label="Gruppaga qo'shilgan" value={joinedCount} />
        <StatCard label="Rol berilgan (bog'langan)" value={linkedCount} accentColor="text-mint" />
      </div>

      <div className="flex gap-2">
        {[
          { id: "all", label: "Hammasi" },
          { id: "started", label: "/start bosganlar" },
          { id: "joined", label: "Gruppaga qo'shilganlar" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filter === f.id ? "bg-accent/15 text-accent border-accent/30" : "border-border text-textMuted hover:text-textPrimary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-panelAlt text-textMuted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Foydalanuvchi</th>
              <th className="text-left px-4 py-3">/start</th>
              <th className="text-left px-4 py-3">Gruppa</th>
              <th className="text-left px-4 py-3">Bog'langan xodim</th>
              <th className="text-left px-4 py-3">Vazifa berish</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <p>{u.first_name || "Noma'lum"}</p>
                  <p className="text-textMuted text-xs">@{u.username || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={u.started_bot ? "text-mint" : "text-textMuted"}>{u.started_bot ? "Ha" : "Yo'q"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={u.joined_group ? "text-mint" : "text-textMuted"}>
                    {u.joined_group ? u.group_title || "Ha" : "Yo'q"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.linked_full_name ? (
                    <span className="text-accent text-xs">{u.linked_full_name}</span>
                  ) : user.role === "admin" ? (
                    <button
                      onClick={() => openRoleModal(u)}
                      className="text-xs text-textMuted hover:text-accent flex items-center gap-1"
                    >
                      <UserPlus2 size={12} />
                      Rol berish
                    </button>
                  ) : (
                    <span className="text-textMuted text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      value={taskDraft[u.id] || ""}
                      onChange={(e) => setTaskDraft((d) => ({ ...d, [u.id]: e.target.value }))}
                      placeholder="vazifa matni..."
                      className="bg-panelAlt border border-border rounded px-2 py-1 text-xs flex-1"
                    />
                    <button
                      onClick={() => assign(u.id)}
                      className="text-xs bg-accent/20 text-accent rounded px-3 py-1 hover:bg-accent/30 transition-colors"
                    >
                      Yubor
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-textMuted">
                  Hozircha foydalanuvchi yo'q. Bot tokeni sozlangach, /start bosganlar shu yerda ko'rinadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {roleModalUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium">
                {roleModalUser.first_name || "Foydalanuvchi"}ga rol berish
              </h3>
              <button onClick={() => setRoleModalUser(null)} className="text-textMuted hover:text-textPrimary text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-textMuted uppercase tracking-wide">Yangi xodim sifatida yaratish</p>
              <form onSubmit={submitCreateEmployee} className="space-y-2">
                <input
                  placeholder="To'liq ism"
                  value={roleForm.full_name}
                  onChange={(e) => setRoleForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                  required
                />
                <input
                  placeholder="Login"
                  value={roleForm.username}
                  onChange={(e) => setRoleForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                  required
                />
                <input
                  type="password"
                  placeholder="Parol"
                  value={roleForm.password}
                  onChange={(e) => setRoleForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                  required
                />
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                >
                  {Object.entries(roleLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {roleError && <p className="text-coral text-xs">{roleError}</p>}
                <button className="w-full bg-accent rounded px-4 py-2 text-sm font-medium hover:bg-accentDim transition-colors">
                  Yaratish va bog'lash
                </button>
              </form>
            </div>

            {existingEmployees.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs text-textMuted uppercase tracking-wide">Yoki mavjud xodimga bog'lash</p>
                <div className="flex gap-2">
                  <select
                    value={linkExistingId}
                    onChange={(e) => setLinkExistingId(e.target.value)}
                    className="flex-1 bg-panelAlt border border-border rounded px-2 py-1.5 text-sm"
                  >
                    <option value="">Xodimni tanlang...</option>
                    {existingEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.username})</option>
                    ))}
                  </select>
                  <button
                    onClick={submitLinkExisting}
                    className="bg-accent/20 text-accent rounded px-3 py-1.5 text-sm hover:bg-accent/30 transition-colors"
                  >
                    Bog'lash
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
