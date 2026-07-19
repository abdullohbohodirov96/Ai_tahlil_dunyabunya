import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../../../../lib/db.js";
import { requireAuth } from "../../../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { full_name, username, password, role } = await req.json();
  if (!full_name || !username || !password || !role) {
    return NextResponse.json({ error: "Barcha maydonlar to'ldirilishi shart" }, { status: 400 });
  }

  const tgUser = await query("SELECT * FROM tg_users WHERE id = $1", [params.id]);
  if (!tgUser.rows.length) {
    return NextResponse.json({ error: "Telegram foydalanuvchi topilmadi" }, { status: 404 });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const userRes = await query(
      "INSERT INTO users (full_name, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [full_name, username.trim(), hash, role]
    );
    const newUserId = userRes.rows[0].id;

    await query("UPDATE tg_users SET linked_user_id = $1 WHERE id = $2", [newUserId, params.id]);

    return NextResponse.json({ id: newUserId, ok: true });
  } catch {
    return NextResponse.json({ error: "Bu username band, boshqasini tanlang" }, { status: 400 });
  }
}
