import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

const KPI_MIN = 50_000_000; // minimal sotuv (so'm)
const KPI_STEP = 50_000_000; // har qadam
const KPI_BONUS = 500_000; // har qadam uchun bonus (so'm)

function calcKpi(totalSales) {
  if (totalSales < KPI_MIN) {
    return { bonus: 0, nextTargetIn: KPI_MIN - totalSales, steps: 0 };
  }
  const steps = Math.floor((totalSales - KPI_MIN) / KPI_STEP) + 1;
  const nextTarget = KPI_MIN + steps * KPI_STEP;
  return { bonus: steps * KPI_BONUS, nextTargetIn: nextTarget - totalSales, steps };
}

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");

  let dateFilter = "";
  const params = [];
  if (from) {
    params.push(from);
    dateFilter += ` AND l.updated_at >= $${params.length}::date`;
  }
  if (to) {
    params.push(to);
    dateFilter += ` AND l.updated_at <= ($${params.length}::date + interval '1 day')`;
  }

  const res = await query(`
    SELECT u.id, u.full_name, u.base_salary,
           COUNT(l.id) FILTER (WHERE l.sold = true ${dateFilter}) as sales_count,
           COALESCE(SUM(l.sale_amount) FILTER (WHERE l.sold = true ${dateFilter}), 0) as sales_total,
           COUNT(l.id) as total_leads
    FROM users u
    LEFT JOIN leads l ON l.manager_id = u.id
    WHERE u.role = 'sales_manager' AND u.active = true
    GROUP BY u.id
    ORDER BY sales_total DESC
  `, params);

  const board = res.rows.map((r) => {
    const total = Number(r.sales_total);
    const kpi = calcKpi(total);
    const baseSalary = Number(r.base_salary || 0);
    return {
      id: r.id,
      full_name: r.full_name,
      sales_count: Number(r.sales_count),
      sales_total: total,
      total_leads: Number(r.total_leads),
      base_salary: baseSalary,
      kpi_bonus: kpi.bonus,
      next_kpi_in: kpi.nextTargetIn,
      projected_salary: baseSalary + kpi.bonus,
    };
  });

  const overall = {
    total_sales: board.reduce((s, b) => s + b.sales_total, 0),
    total_count: board.reduce((s, b) => s + b.sales_count, 0),
  };

  return NextResponse.json({ board, overall, kpi_rules: { min: KPI_MIN, step: KPI_STEP, bonus: KPI_BONUS } });
}
