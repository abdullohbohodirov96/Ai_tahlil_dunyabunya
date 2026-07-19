import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { query } from "../../../../lib/db.js";

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const hasToken = !!process.env.IG_ACCESS_TOKEN;
  if (!hasToken) {
    return NextResponse.json({
      connected: false,
      platforms: [
        { platform: "Instagram", followers: 12450, posts: 18, reach: 98000, engagement: 4200 },
        { platform: "Telegram", followers: 6300, posts: 22, reach: 41000, engagement: 1800 },
      ],
    });
  }
  // TODO: haqiqiy Instagram Graph API so'rovi shu yerga qo'yiladi
  const rows = await query("SELECT * FROM smm_stats ORDER BY day DESC LIMIT 30");
  return NextResponse.json({ connected: true, platforms: rows.rows });
}
