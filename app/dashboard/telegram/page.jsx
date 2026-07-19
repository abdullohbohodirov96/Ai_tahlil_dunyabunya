"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/apiClient.js";
import { useLanguage } from "../../../lib/i18n.js";

export default function TelegramPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [taskDraft, setTaskDraft] = useState({});
  const { t } = useLanguage();

  async function load() {
    let query = "";
    if (filter === "started") query = "?started=true";
    if (filter === "joined") query = "?joined=true";
    const rows = await api.tgUsers(query).catch(() => []);
    setUsers(rows);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function assign(userId) {
    const title = taskDraft[userId];
    if (!title) return;
    await api.assignTask(userId, title);
    setTaskDraft((d) => ({ ...d, [userId]: "" }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("telegram_title")}</h1>
        <p className="text-textMuted text-sm mt-1">
          {t("telegram_subtitle")}
        </p>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
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
                  <div className="flex gap-2">
                    <input
                      value={taskDraft[u.id] || ""}
                      onChange={(e) => setTaskDraft((d) => ({ ...d, [u.id]: e.target.value }))}
                      placeholder="vazifa matni..."
                      className="bg-panelAlt border border-border rounded px-2 py-1 text-xs flex-1"
                    />
                    <button
                      onClick={() => assign(u.id)}
                      className="text-xs bg-accent/20 text-accent rounded px-3 py-1 hover:bg-accent/30"
                    >
                      Yubor
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-textMuted">
                  Hozircha foydalanuvchi yo'q. Bot tokeni sozlangach, /start bosganlar shu yerda ko'rinadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
