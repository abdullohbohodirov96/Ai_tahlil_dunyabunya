import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";
import { hasModuleAccess } from "../../../../lib/permissionCheck.js";
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
  const { user, error } = requireAuth(req);
  if (error) return error;

  const canEditSales = await hasModuleAccess(user, "sales", "can_edit");
  if (!canEditSales) {
    return NextResponse.json({ error: "Sheetdan sinxronlash uchun ruxsatingiz yo'q" }, { status: 403 });
  }

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
    let updated = 0;
    for (const row of rows) {
      // Avval shu rowId bilan mavjud lead bormi tekshiramiz
      const existing = await query("SELECT id, manager_id FROM leads WHERE sheet_row_id = $1", [row.rowId]);

      if (existing.rows.length) {
        // Mavjud lead — CRM maydonlarini (holat, izoh va h.k.) saqlab qolib,
        // faqat Sheetdan kelgan xom ma'lumotni (ism, telefon, manba) yangilaymiz
        await query(
          "UPDATE leads SET full_name = $1, phone = $2, source = $3 WHERE id = $4",
          [row.fullName, row.phone, row.source, existing.rows[0].id]
        );
        updated++;
      } else {
        const managerId = managers[idx % managers.length].id;
        await query(
          `INSERT INTO leads (sheet_row_id, full_name, phone, source, manager_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [row.rowId, row.fullName, row.phone, row.source, managerId]
        );
        added++;
        await bumpDaily(managerId, "leads_count");
        idx++;
      }
    }
    return NextResponse.json({ synced: rows.length, added, updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
