"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/apiClient.js";
import { PermissionsProvider } from "../../lib/permissions.js";
import Sidebar from "../../components/Sidebar.jsx";
import PulseStrip from "../../components/PulseStrip.jsx";
import AssistantWidget from "../../components/AssistantWidget.jsx";

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("jarvis_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem("jarvis_token");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !user) return null;

  return (
    <UserContext.Provider value={user}>
      <PermissionsProvider>
        <div className="flex">
          <Sidebar user={user} />
          <div className="flex-1 min-w-0">
            <PulseStrip />
            <main className="p-8 max-w-6xl mx-auto">{children}</main>
          </div>
          <AssistantWidget />
        </div>
      </PermissionsProvider>
    </UserContext.Provider>
  );
}
