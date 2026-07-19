"use client";

const BASE = "/api";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("jarvis_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
  return data;
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => request("/auth/me"),
  employees: () => request("/auth/employees"),
  addEmployee: (payload) =>
    request("/auth/employees", { method: "POST", body: JSON.stringify(payload) }),
  updateEmployee: (id, payload) =>
    request(`/auth/employees/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  leads: () => request("/sales/leads"),
  syncSheet: () => request("/sales/sync-sheet", { method: "POST" }),
  updateLead: (id, payload) =>
    request(`/sales/leads/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  salesStats: () => request("/sales/stats"),

  target: (range) => request(`/marketing/target${range ? `?range=${range}` : ""}`),
  smm: () => request("/marketing/smm"),

  tgUsers: (params = "") => request(`/telegram/users${params}`),
  tgTasks: (tgUserId) => request(`/telegram/tasks/${tgUserId}`),
  assignTask: (tg_user_id, title) =>
    request("/telegram/tasks", { method: "POST", body: JSON.stringify({ tg_user_id, title }) }),

  connections: () => request("/admin/connections"),
  updateConnection: (service, payload) =>
    request(`/admin/connections/${service}`, { method: "PATCH", body: JSON.stringify(payload) }),
  permissions: (userId) => request(`/admin/permissions/${userId}`),
  setPermission: (payload) =>
    request("/admin/permissions", { method: "POST", body: JSON.stringify(payload) }),
  myPermissions: () => request("/auth/permissions/me"),
  resetPassword: (id, password) =>
    request(`/auth/employees/${id}`, { method: "PATCH", body: JSON.stringify({ password }) }),

  chat: (message) =>
    request("/assistant/chat", { method: "POST", body: JSON.stringify({ message }) }),

  generateTelegramLink: () => request("/telegram/link/generate", { method: "POST" }),
  telegramLinkStatus: () => request("/telegram/link/status"),

  getSettings: () => request("/admin/settings"),
  updateSetting: (key, value) =>
    request("/admin/settings", { method: "POST", body: JSON.stringify({ key, value }) }),
};
