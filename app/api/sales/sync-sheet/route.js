import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";
import { fetchLeadsFromSheet } from "../../../../lib/sheetsService.js";

export const dynamic = "force-dynamic";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function bumpDaily(managerId, field) {
  const day = today();
  const existing = await query(
    "SELECT id FROM sales_daily WHERE manager_id = $1 AND day = $2",
    [managerId, day]
  );
  if (existing.rows.length) {
    await query(`UPDATE sales_daily SET ${field} = ${field} + 1 WHERE id = $1`, [existing.rows[0].id]);
  } else {
    await query(
      `INSERT INTO sales_daily (manager_id, day, ${field}) VALUES ($1, $2, 1)`,
      [managerId, day]
    );
  }
}

export async function POST(req) {
  const { error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  try {
    const rows = await fetchLeadsFromSheet();
    const managersRes = await query(
      "SELECT id FROM users WHERE role = 'sales_manager' AND active = true ORDER BY id"
    );
    const managers = managersRes.rows;
    if (!managers.length) {
      return NextResponse.json(
        { error: "Faol sotuv menejerlari yo'q. Avval xodim qo'shing." },
        { status: 400 }
      );
    }

    let idx = 0;
    let added = 0;
    for (const row of rows) {
      const managerId = managers[idx % managers.length].id;
      const res = await query(
        `INSERT INTO leads (sheet_row_id, full_name, phone, source, manager_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (sheet_row_id) DO NOTHING RETURNING id`,
        [row.rowId, row.fullName, row.phone, row.source, managerId]
      );
      if (res.rows.length) {
        added++;
        await bumpDaily(managerId, "leads_count");
        idx++;
      }
    }
    return NextResponse.json({ synced: rows.length, added });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
