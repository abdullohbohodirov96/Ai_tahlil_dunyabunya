import { NextResponse } from "next/server";
import { query } from "../../../../../../lib/db.js";
import { requireAuth } from "../../../../../../lib/auth.js";
import { hasModuleAccess } from "../../../../../../lib/permissionCheck.js";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const lead = await query("SELECT manager_id FROM leads WHERE id = $1", [params.id]);
  if (!lead.rows.length) return NextResponse.json({ error: "Lead topilmadi" }, { status: 404 });
  if (user.role === "sales_manager" && lead.rows[0].manager_id !== user.id) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const res = await query(
    `SELECT a.*, u.full_name as author_name
     FROM lead_activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = $1 ORDER BY a.created_at DESC`,
    [params.id]
  );
  return NextResponse.json(res.rows);
}

export async function POST(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const canEditSales = await hasModuleAccess(user, "sales", "can_edit");
  if (!canEditSales) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Matn kerak" }, { status: 400 });

  const lead = await query("SELECT manager_id FROM leads WHERE id = $1", [params.id]);
  if (!lead.rows.length) return NextResponse.json({ error: "Lead topilmadi" }, { status: 404 });
  if (user.role === "sales_manager" && lead.rows[0].manager_id !== user.id) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  await query(
    "INSERT INTO lead_activities (lead_id, user_id, type, text) VALUES ($1, $2, 'note', $3)",
    [params.id, user.id, text]
  );
  return NextResponse.json({ ok: true });
}
