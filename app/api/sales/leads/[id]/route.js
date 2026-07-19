import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

async function bumpSale(managerId) {
  const day = new Date().toISOString().slice(0, 10);
  const existing = await query(
    "SELECT id FROM sales_daily WHERE manager_id = $1 AND day = $2",
    [managerId, day]
  );
  if (existing.rows.length) {
    await query("UPDATE sales_daily SET sales_count = sales_count + 1 WHERE id = $1", [existing.rows[0].id]);
  } else {
    await query(
      "INSERT INTO sales_daily (manager_id, day, sales_count) VALUES ($1, $2, 1)",
      [managerId, day]
    );
  }
}

export async function PATCH(req, { params }) {
  const { user, error } = requireAuth(req, "sales_manager", "admin");
  if (error) return error;

  const { status, note } = await req.json();
  const leadRes = await query("SELECT * FROM leads WHERE id = $1", [params.id]);
  const lead = leadRes.rows[0];
  if (!lead) return NextResponse.json({ error: "Lead topilmadi" }, { status: 404 });
  if (user.role === "sales_manager" && lead.manager_id !== user.id) {
    return NextResponse.json({ error: "Bu lead sizga tegishli emas" }, { status: 403 });
  }

  await query(
    "UPDATE leads SET status = COALESCE($1, status), note = COALESCE($2, note), updated_at = now() WHERE id = $3",
    [status ?? null, note ?? null, params.id]
  );

  if (status === "sifatli") {
    await bumpSale(lead.manager_id);
  }

  return NextResponse.json({ ok: true });
}
