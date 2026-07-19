"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/apiClient.js";
import { useLanguage } from "../../lib/i18n.js";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem("jarvis_token", data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-accent pulse-dot" />
          <span className="font-display font-semibold text-xl tracking-tight">{t("appName")}</span>
        </div>
        <form onSubmit={handleSubmit} className="bg-panel border border-border rounded-2xl p-8 space-y-4">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wide">{t("login_title")}</label>
            <input
              className="mt-1 w-full bg-panelAlt border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wide">{t("login_password")}</label>
            <input
              type="password"
              className="mt-1 w-full bg-panelAlt border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-coral text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-base font-medium rounded-lg py-2.5 hover:bg-accentDim transition-colors disabled:opacity-50"
          >
            {loading ? t("login_loading") : t("login_submit")}
          </button>
        </form>
        <p className="text-center text-xs text-textMuted mt-4">{t("login_default_hint")}</p>
      </div>
    </div>
  );
}
