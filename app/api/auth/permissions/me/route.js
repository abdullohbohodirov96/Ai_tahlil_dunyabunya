import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export const dynamic = "force-dynamic";

// Rol asosidagi standart ruxsatlar — admin har doim hammasiga ega.
// Boshqa rollar uchun, agar account_permissions jadvalida aniq yozuv bo'lmasa,
// shu standart qiymatlar ishlatiladi (eski foydalanuvchilar buzilib qolmasligi uchun).
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

const MODULES = ["marketing_target", "marketing_smm", "sales", "telegram"];

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  if (user.role === "admin") {
    const all = {};
    for (const m of MODULES) all[m] = { can_view: true, can_edit: true };
    return NextResponse.json({ role: user.role, permissions: all });
  }

  const rows = await query("SELECT * FROM account_permissions WHERE user_id = $1", [user.id]);
  const defaults = ROLE_DEFAULTS[user.role] || {};

  const permissions = {};
  for (const m of MODULES) {
    const override = rows.rows.find((r) => r.module === m);
    if (override) {
      permissions[m] = { can_view: !!override.can_view, can_edit: !!override.can_edit };
    } else {
      permissions[m] = defaults[m] || { can_view: false, can_edit: false };
    }
  }

  return NextResponse.json({ role: user.role, permissions });
}
