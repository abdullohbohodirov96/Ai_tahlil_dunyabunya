import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { query } from "../../../../lib/db.js";

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const hasToken = !!process.env.META_ADS_ACCESS_TOKEN;
  if (!hasToken) {
    return NextResponse.json({
      connected: false,
      campaigns: [
        { name: "Yoz aksiyasi", spend: 1250000, impressions: 84000, clicks: 2100, leads: 63 },
        { name: "Yangi mahsulot", spend: 780000, impressions: 51000, clicks: 1400, leads: 34 },
      ],
    });
  }
  // TODO: haqiqiy Meta Marketing API so'rovi shu yerga qo'yiladi
  const rows = await query("SELECT * FROM target_stats ORDER BY day DESC LIMIT 30");
  return NextResponse.json({ connected: true, campaigns: rows.rows });
}
