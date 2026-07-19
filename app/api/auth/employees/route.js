import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;
  const res = await query(
    "SELECT id, full_name, username, role, active, base_salary, created_at FROM users ORDER BY id DESC"
  );
  return NextResponse.json(res.rows);
}

export async function POST(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { full_name, username, password, role } = await req.json();
  if (!full_name || !username || !password || !role) {
    return NextResponse.json({ error: "Barcha maydonlar to'ldirilishi shart" }, { status: 400 });
  }
  const cleanUsername = username.trim();
  const hash = bcrypt.hashSync(password, 10);
  try {
    const res = await query(
      "INSERT INTO users (full_name, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [full_name, cleanUsername, hash, role]
    );
    return NextResponse.json({ id: res.rows[0].id, full_name, username: cleanUsername, role });
  } catch {
    return NextResponse.json({ error: "Bu username band, boshqasini tanlang" }, { status: 400 });
  }
}
