import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const res = await query(
    "SELECT telegram_id, username, first_name FROM tg_users WHERE linked_user_id = $1",
    [user.id]
  );

  if (!res.rows.length) {
    return NextResponse.json({ linked: false });
  }
  return NextResponse.json({ linked: true, ...res.rows[0] });
}
