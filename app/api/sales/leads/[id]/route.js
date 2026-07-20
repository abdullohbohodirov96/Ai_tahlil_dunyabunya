import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";
import { hasModuleAccess } from "../../../../../lib/permissionCheck.js";

export const dynamic = "force-dynamic";

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

const contactLabels = { ha: "Bog'landi", yoq: "Bog'lanmadi", kotarmadi: "Ko'tarmadi", ochiq: "Telefon ochiq" };
const qualityLabels = { issiq: "Issiq", iliq: "Iliq", sovuq: "Sovuq" };

export async function PATCH(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const canEditSales = await hasModuleAccess(user, "sales", "can_edit");
  if (!canEditSales) {
    return NextResponse.json({ error: "Sotuvni tahrirlash uchun ruxsatingiz yo'q" }, { status: 403 });
  }

  const body = await req.json();
  const { status, note, contact_status, quality, follow_up_date, sold, sale_amount } = body;

  const leadRes = await query("SELECT * FROM leads WHERE id = $1", [params.id]);
  const lead = leadRes.rows[0];
  if (!lead) return NextResponse.json({ error: "Lead topilmadi" }, { status: 404 });
  if (user.role === "sales_manager" && lead.manager_id !== user.id) {
    return NextResponse.json({ error: "Bu lead sizga tegishli emas" }, { status: 403 });
  }

  const resolvedStatus = sold === true ? "sifatli" : status;

  await query(
    `UPDATE leads SET
       status = COALESCE($1, status),
       note = COALESCE($2, note),
       contact_status = COALESCE($3, contact_status),
       quality = COALESCE($4, quality),
       follow_up_date = COALESCE($5, follow_up_date),
       sold = COALESCE($6, sold),
       sale_amount = COALESCE($7, sale_amount),
       updated_at = now()
     WHERE id = $8`,
    [
      resolvedStatus ?? null,
      note ?? null,
      contact_status ?? null,
      quality ?? null,
      follow_up_date ?? null,
      sold ?? null,
      sale_amount ?? null,
      params.id,
    ]
  );

  // O'zgarishlarni tarixga (activity log) yozib boramiz
  const changes = [];
  if (contact_status && contact_status !== lead.contact_status) {
    changes.push(`Bog'lanish holati: ${contactLabels[contact_status] || contact_status}`);
  }
  if (quality && quality !== lead.quality) {
    changes.push(`Lead sifati: ${qualityLabels[quality] || quality}`);
  }
  if (follow_up_date) {
    changes.push(`Qayta aloqa sanasi: ${follow_up_date}`);
  }
  if (sold === true && !lead.sold) {
    changes.push(`✅ Sotildi${sale_amount ? ` — $${sale_amount}` : ""}`);
  }
  if (note && note !== lead.note) {
    changes.push(`Izoh: ${note}`);
  }
  if (changes.length) {
    await query(
      "INSERT INTO lead_activities (lead_id, user_id, type, text) VALUES ($1, $2, 'update', $3)",
      [params.id, user.id, changes.join(" · ")]
    );
  }

  const wasAlreadySold = lead.sold;
  if (sold === true && !wasAlreadySold) {
    await bumpSale(lead.manager_id);
  }

  return NextResponse.json({ ok: true });
}

// Leadni butunlay o'chirish (tarixi bilan birga)
export async function DELETE(req, { params }) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const canEditSales = await hasModuleAccess(user, "sales", "can_edit");
  if (!canEditSales) {
    return NextResponse.json({ error: "Lead o'chirish uchun ruxsatingiz yo'q" }, { status: 403 });
  }

  await query("DELETE FROM lead_activities WHERE lead_id = $1", [params.id]);
  await query("DELETE FROM leads WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
