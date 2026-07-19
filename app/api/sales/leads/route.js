import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  let res;
  if (user.role === "sales_manager") {
    res = await query("SELECT * FROM leads WHERE manager_id = $1 ORDER BY id DESC", [user.id]);
  } else {
    res = await query("SELECT * FROM leads ORDER BY id DESC");
  }
  return NextResponse.json(res.rows);
}

// Qo'lda (ruchnoy) yangi lead qo'shish
export async function POST(req) {
  const { user, error } = requireAuth(req, "admin", "marketing_head", "sales_manager");
  if (error) return error;

  const { full_name, phone, source, manager_id } = await req.json();
  if (!full_name || !phone) {
    return NextResponse.json({ error: "Ism va telefon kerak" }, { status: 400 });
  }

  // sales_manager o'ziga, boshqalar tanlagan (yoki eng kam yuklangan) menejerga biriktiradi
  let resolvedManagerId = manager_id;
  if (user.role === "sales_manager") {
    resolvedManagerId = user.id;
  } else if (!resolvedManagerId) {
    const managers = await query(
      "SELECT id FROM users WHERE role = 'sales_manager' AND active = true ORDER BY id LIMIT 1"
    );
    resolvedManagerId = managers.rows[0]?.id || null;
  }

  const rowId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const res = await query(
    `INSERT INTO leads (sheet_row_id, full_name, phone, source, manager_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [rowId, full_name, phone, source || "Qo'lda kiritilgan", resolvedManagerId]
  );

  return NextResponse.json(res.rows[0]);
}
