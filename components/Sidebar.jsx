"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../lib/i18n.js";

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const links = [
    { to: "/dashboard", label: t("nav_overview"), icon: "◎" },
    { to: "/dashboard/marketing", label: t("nav_marketing"), icon: "◈" },
    { to: "/dashboard/sales", label: t("nav_sales"), icon: "◆" },
    { to: "/dashboard/telegram", label: t("nav_telegram"), icon: "◇" },
    { to: "/dashboard/admin", label: t("nav_admin"), icon: "⚙" },
  ];

  function logout() {
    localStorage.removeItem("jarvis_token");
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-panel/60 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent pulse-dot" />
          <span className="font-display font-semibold tracking-tight text-lg">{t("appName")}</span>
        </div>
        <p className="text-xs text-textMuted mt-1">{t("appTagline")}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => {
          const isActive = l.to === "/dashboard" ? pathname === l.to : pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              href={l.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-textMuted hover:text-textPrimary hover:bg-panelAlt border border-transparent"
              }`}
            >
              <span className="text-base leading-none">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <p className="text-sm font-medium truncate">{user?.full_name}</p>
        <p className="text-xs text-textMuted mb-3">{user?.role}</p>
        <button onClick={logout} className="text-xs text-coral hover:underline">
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
