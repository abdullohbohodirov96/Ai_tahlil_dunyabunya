import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../../lib/db.js";
import { signToken } from "../../../../lib/auth.js";

export async function POST(req) {
  const { username, password } = await req.json();
  const res = await query("SELECT * FROM users WHERE username = $1", [username]);
  const user = res.rows[0];
  if (!user || !user.active) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 401 });
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
  });

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
  });
}
