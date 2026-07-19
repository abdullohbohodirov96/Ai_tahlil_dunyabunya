import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting } from "../../../../lib/settings.js";

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const token = await getSetting("ig_access_token", "IG_ACCESS_TOKEN");
  const accountId = await getSetting("ig_business_account_id", "IG_BUSINESS_ACCOUNT_ID");

  if (!token || !accountId) {
    return NextResponse.json({
      connected: false,
      platforms: [
        { platform: "Instagram", followers: 12450, posts: 18, reach: 98000, engagement: 4200 },
        { platform: "Telegram", followers: 6300, posts: 22, reach: 41000, engagement: 1800 },
      ],
    });
  }

  try {
    // Asosiy akkaunt ma'lumotlari: followerlar va postlar soni
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}?fields=followers_count,media_count&access_token=${token}`
    );
    const profile = await profileRes.json();

    if (profile.error) {
      return NextResponse.json(
        { connected: false, error: `Instagram API xatosi: ${profile.error.message}`, platforms: [] },
        { status: 200 }
      );
    }

    // So'nggi 30 kunlik qamrov va faollik (reach/engagement) — akkaunt darajasidagi insights
    let reach = 0;
    let engagement = 0;
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/insights?metric=reach,accounts_engaged&period=days_28&metric_type=total_value&access_token=${token}`
      );
      const insights = await insightsRes.json();
      for (const item of insights.data || []) {
        const value = item.total_value?.value || 0;
        if (item.name === "reach") reach = value;
        if (item.name === "accounts_engaged") engagement = value;
      }
    } catch {
      // insights olinmasa ham asosiy ma'lumot ko'rsatiladi
    }

    return NextResponse.json({
      connected: true,
      platforms: [
        {
          platform: "Instagram",
          followers: Number(profile.followers_count || 0),
          posts: Number(profile.media_count || 0),
          reach,
          engagement,
        },
      ],
    });
  } catch (e) {
    return NextResponse.json(
      { connected: false, error: `Instagram API bilan bog'lanib bo'lmadi: ${e.message}`, platforms: [] },
      { status: 200 }
    );
  }
}
