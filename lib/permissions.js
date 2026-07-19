"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./apiClient.js";

const PermissionsContext = createContext(null);

const MODULE_LABELS = {
  marketing_target: "Marketing — Target",
  marketing_smm: "Marketing — SMM",
  sales: "Sotuv",
  telegram: "Telegram",
};

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myPermissions()
      .then((res) => setPermissions(res.permissions))
      .catch(() => setPermissions({}))
      .finally(() => setLoading(false));
  }, []);

  function canView(moduleId) {
    if (!permissions) return false;
    return !!permissions[moduleId]?.can_view;
  }

  function canEdit(moduleId) {
    if (!permissions) return false;
    return !!permissions[moduleId]?.can_edit;
  }

  return (
    <PermissionsContext.Provider value={{ permissions, loading, canView, canEdit }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}

export { MODULE_LABELS };
