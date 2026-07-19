import { NextResponse } from "next/server";
import { query } from "../../../../../../lib/db.js";
import { requireAuth } from "../../../../../../lib/auth.js";

export async function POST(req, { params }) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id kerak" }, { status: 400 });

  await query("UPDATE tg_users SET linked_user_id = $1 WHERE id = $2", [user_id, params.id]);
  return NextResponse.json({ ok: true });
}
