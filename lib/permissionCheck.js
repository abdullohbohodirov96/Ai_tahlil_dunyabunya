import { query } from "./db.js";

const ROLE_DEFAULTS = {
  marketing_head: {
    marketing_target: { can_view: true, can_edit: true },
    marketing_smm: { can_view: true, can_edit: true },
    sales: { can_view: true, can_edit: false },
    telegram: { can_view: true, can_edit: true },
  },
  sales_manager: {
    sales: { can_view: true, can_edit: true },
  },
  smm: {
    marketing_smm: { can_view: true, can_edit: true },
  },
  viewer: {},
};

// user: { id, role } — moduleId: 'sales' | 'marketing_target' | 'marketing_smm' | 'telegram'
// need: 'can_view' | 'can_edit'
export async function hasModuleAccess(user, moduleId, need = "can_view") {
  if (user.role === "admin") return true;

  const res = await query(
    "SELECT can_view, can_edit FROM account_permissions WHERE user_id = $1 AND module = $2",
    [user.id, moduleId]
  );
  if (res.rows.length) return !!res.rows[0][need];

  const fallback = ROLE_DEFAULTS[user.role]?.[moduleId];
  return !!fallback?.[need];
}
