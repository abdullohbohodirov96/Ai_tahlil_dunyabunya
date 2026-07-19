import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { user_id, module, can_view, can_edit } = await req.json();
  await query(
    `INSERT INTO account_permissions (user_id, module, can_view, can_edit)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, module) DO UPDATE SET can_view = excluded.can_view, can_edit = excluded.can_edit`,
    [user_id, module, !!can_view, !!can_edit]
  );
  return NextResponse.json({ ok: true });
}
