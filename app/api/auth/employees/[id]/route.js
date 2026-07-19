import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { active, role, password, base_salary } = await req.json();
  const fields = [];
  const values = [];
  let idx = 1;
  if (active !== undefined) {
    fields.push(`active = $${idx++}`);
    values.push(!!active);
  }
  if (role) {
    fields.push(`role = $${idx++}`);
    values.push(role);
  }
  if (password) {
    fields.push(`password_hash = $${idx++}`);
    values.push(bcrypt.hashSync(password, 10));
  }
  if (base_salary !== undefined) {
    fields.push(`base_salary = $${idx++}`);
    values.push(Number(base_salary) || 0);
  }
  if (!fields.length) {
    return NextResponse.json({ error: "O'zgartiriladigan maydon yo'q" }, { status: 400 });
  }
  values.push(params.id);
  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, values);
  return NextResponse.json({ ok: true });
}

// Xodimni butunlay o'chirish (bog'liq yozuvlar uzilib, leadlar egasiz qoladi)
export async function DELETE(req, { params }) {
  const { user, error } = requireAuth(req, "admin");
  if (error) return error;
  if (Number(params.id) === user.id) {
    return NextResponse.json({ error: "O'zingizni o'chira olmaysiz" }, { status: 400 });
  }
  await query("UPDATE leads SET manager_id = NULL WHERE manager_id = $1", [params.id]);
  await query("UPDATE tg_users SET linked_user_id = NULL WHERE linked_user_id = $1", [params.id]);
  await query("DELETE FROM account_permissions WHERE user_id = $1", [params.id]);
  await query("DELETE FROM todos WHERE assignee_id = $1", [params.id]);
  await query("DELETE FROM users WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
