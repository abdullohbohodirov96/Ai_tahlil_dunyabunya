"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Megaphone, Users, Send, Settings, LogOut, Link2, ListTodo } from "lucide-react";
import { useLanguage } from "../lib/i18n.js";
import { usePermissions } from "../lib/permissions.js";
import TelegramLinkModal from "./TelegramLinkModal.jsx";

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { canView } = usePermissions();
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: t("nav_overview"), icon: LayoutDashboard, always: true },
    {
      to: "/dashboard/marketing",
      label: t("nav_marketing"),
      icon: Megaphone,
      module: ["marketing_target", "marketing_smm"],
    },
    { to: "/dashboard/sales", label: t("nav_sales"), icon: Users, module: ["sales"] },
    { to: "/dashboard/telegram", label: t("nav_telegram"), icon: Send, module: ["telegram"] },
    { to: "/dashboard/todos", label: "Vazifalar", icon: ListTodo, always: true },
    { to: "/dashboard/admin", label: t("nav_admin"), icon: Settings, adminOnly: true },
  ];

  function isVisible(link) {
    if (link.always) return true;
    if (link.adminOnly) return user.role === "admin";
    if (user.role === "admin") return true;
    return link.module.some((m) => canView(m));
  }

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
        {links.filter(isVisible).map((l) => {
          const isActive = l.to === "/dashboard" ? pathname === l.to : pathname.startsWith(l.to);
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              href={l.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-textMuted hover:text-textPrimary hover:bg-panelAlt hover:translate-x-0.5 border border-transparent"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border space-y-2">
        <p className="text-sm font-medium truncate">{user?.full_name}</p>
        <p className="text-xs text-textMuted">{user?.role}</p>
        <button
          onClick={() => setLinkModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-accent hover:underline"
        >
          <Link2 size={13} />
          Telegram ulash
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-coral hover:underline"
        >
          <LogOut size={13} />
          {t("logout")}
        </button>
      </div>
      <TelegramLinkModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} />
    </aside>
  );
}
