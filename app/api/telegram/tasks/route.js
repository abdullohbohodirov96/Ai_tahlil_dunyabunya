import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";
import { tgSend } from "../../../../lib/telegram.js";

export async function POST(req) {
  const { error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  const { tg_user_id, title } = await req.json();
  if (!tg_user_id || !title) {
    return NextResponse.json({ error: "tg_user_id va title kerak" }, { status: 400 });
  }

  const res = await query(
    "INSERT INTO tg_tasks (tg_user_id, title) VALUES ($1, $2) RETURNING id",
    [tg_user_id, title]
  );

  const userRes = await query("SELECT * FROM tg_users WHERE id = $1", [tg_user_id]);
  if (userRes.rows.length) {
    await tgSend(userRes.rows[0].telegram_id, `📌 Yangi vazifa: ${title}`);
  }

  return NextResponse.json({ id: res.rows[0].id, ok: true });
}
