import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export async function PATCH(req, { params }) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { active, role } = await req.json();
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
  if (!fields.length) {
    return NextResponse.json({ error: "O'zgartiriladigan maydon yo'q" }, { status: 400 });
  }
  values.push(params.id);
  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, values);
  return NextResponse.json({ ok: true });
}
