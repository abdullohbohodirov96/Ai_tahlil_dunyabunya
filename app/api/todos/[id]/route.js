import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const { status } = await req.json();
  const todo = await query("SELECT * FROM todos WHERE id = $1", [params.id]);
  if (!todo.rows.length) return NextResponse.json({ error: "Vazifa topilmadi" }, { status: 404 });

  const isOwner = todo.rows[0].assignee_id === user.id;
  const isAdmin = user.role === "admin" || user.role === "marketing_head";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  await query("UPDATE todos SET status = $1 WHERE id = $2", [status, params.id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { user, error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;
  await query("DELETE FROM todos WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
