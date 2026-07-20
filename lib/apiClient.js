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
  createLead: (payload) => request("/sales/leads", { method: "POST", body: JSON.stringify(payload) }),
  deleteLead: (id) => request(`/sales/leads/${id}`, { method: "DELETE" }),
  syncSheet: () => request("/sales/sync-sheet", { method: "POST" }),
  updateLead: (id, payload) =>
    request(`/sales/leads/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  salesStats: () => request("/sales/stats"),
  leadActivities: (id) => request(`/sales/leads/${id}/activities`),
  addLeadActivity: (id, text) =>
    request(`/sales/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ text }) }),

  target: (range) => request(`/marketing/target${range ? `?range=${range}` : ""}`),
  smm: (platform, range) => request(`/marketing/smm?platform=${platform || "instagram"}&range=${range || "30d"}`),

  tgUsers: (params = "") => request(`/telegram/users${params}`),
  tgTasks: (tgUserId) => request(`/telegram/tasks/${tgUserId}`),
  assignTask: (tg_user_id, title) =>
    request("/telegram/tasks", { method: "POST", body: JSON.stringify({ tg_user_id, title }) }),
  createEmployeeFromTg: (tgUserId, payload) =>
    request(`/telegram/users/${tgUserId}/create-employee`, { method: "POST", body: JSON.stringify(payload) }),
  linkExistingEmployee: (tgUserId, user_id) =>
    request(`/telegram/users/${tgUserId}/link-existing`, { method: "POST", body: JSON.stringify({ user_id }) }),

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

  todos: () => request("/todos"),
  createTodo: (payload) => request("/todos", { method: "POST", body: JSON.stringify(payload) }),
  updateTodo: (id, status) => request(`/todos/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteTodo: (id) => request(`/todos/${id}`, { method: "DELETE" }),
  polishTodo: (rawText) => request("/todos", { method: "PUT", body: JSON.stringify({ rawText }) }),
  leaderboard: (from, to) => request(`/sales/leaderboard${from ? `?from=${from}&to=${to || ""}` : ""}`),
  deleteLead: (id) => request(`/sales/leads/${id}`, { method: "DELETE" }),
  deleteEmployee: (id) => request(`/auth/employees/${id}`, { method: "DELETE" }),
  setSalary: (id, base_salary) => request(`/auth/employees/${id}`, { method: "PATCH", body: JSON.stringify({ base_salary }) }),
  contentPlan: (month) => request(`/marketing/content-plan?month=${month}`),
  saveContentPlan: (payload) => request("/marketing/content-plan", { method: "POST", body: JSON.stringify(payload) }),
  deleteContentPlan: (day) => request(`/marketing/content-plan?day=${day}`, { method: "DELETE" }),

  getSettings: () => request("/admin/settings"),
  updateSetting: (key, value) =>
    request("/admin/settings", { method: "POST", body: JSON.stringify({ key, value }) }),
};
