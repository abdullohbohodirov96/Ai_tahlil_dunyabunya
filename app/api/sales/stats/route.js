import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export async function GET(req) {
  const { error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  const perManager = await query(`
    SELECT u.id as manager_id, u.full_name,
           COUNT(l.id) as total_leads,
           SUM(CASE WHEN l.status='sifatli' THEN 1 ELSE 0 END) as sales,
           SUM(CASE WHEN l.status='bogliq_emas' THEN 1 ELSE 0 END) as no_contact
    FROM users u
    LEFT JOIN leads l ON l.manager_id = u.id
    WHERE u.role = 'sales_manager'
    GROUP BY u.id
  `);

  const daily = await query(`
    SELECT day, SUM(leads_count) as leads, SUM(sales_count) as sales
    FROM sales_daily GROUP BY day ORDER BY day DESC LIMIT 30
  `);

  return NextResponse.json({ perManager: perManager.rows, daily: daily.rows });
}
