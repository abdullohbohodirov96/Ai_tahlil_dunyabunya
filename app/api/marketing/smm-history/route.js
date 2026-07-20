import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || "instagram";

  const res = await query(
    "SELECT day, followers, reach, engagement FROM smm_daily_stats WHERE platform = $1 ORDER BY day ASC LIMIT 90",
    [platform]
  );

  return NextResponse.json(
    res.rows.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      followers: r.followers,
      reach: r.reach,
      engagement: r.engagement,
    }))
  );
}
