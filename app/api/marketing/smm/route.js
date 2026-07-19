import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting } from "../../../../lib/settings.js";

export const dynamic = "force-dynamic";

// Instagram akkaunt darajasidagi insights (davr bilan)
async function fetchInstagram(token, accountId, since, until) {
  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}?fields=followers_count,media_count,username&access_token=${token}`
  );
  const profile = await profileRes.json();
  if (profile.error) {
    const hint = profile.error.message?.includes("expired")
      ? " Meta Developer Console'dan yangi UZOQ MUDDATLI (long-lived) token oling va qayta kiriting."
      : "";
    return { error: `Instagram API xatosi: ${profile.error.message}${hint}` };
  }

  let reach = 0, engagement = 0, profileViews = 0;
  try {
    let insightsUrl =
      `https://graph.facebook.com/v19.0/${accountId}/insights` +
      `?metric=reach,accounts_engaged,profile_views&metric_type=total_value&access_token=${token}`;
    insightsUrl += since && until ? `&since=${since}&until=${until}` : `&period=days_28`;
    const insightsRes = await fetch(insightsUrl);
    const insights = await insightsRes.json();
    for (const item of insights.data || []) {
      const value = item.total_value?.value || 0;
      if (item.name === "reach") reach = value;
      if (item.name === "accounts_engaged") engagement = value;
      if (item.name === "profile_views") profileViews = value;
    }
  } catch {}

  return {
    platform: "Instagram",
    username: profile.username,
    followers: Number(profile.followers_count || 0),
    posts: Number(profile.media_count || 0),
    reach,
    engagement,
    profile_views: profileViews,
  };
}

// Facebook sahifa insights (page id + shu token orqali)
async function fetchFacebook(token, pageId, since, until) {
  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=name,followers_count,fan_count&access_token=${token}`
  );
  const profile = await profileRes.json();
  if (profile.error) {
    return { error: `Facebook API xatosi: ${profile.error.message}` };
  }

  let reach = 0, engagement = 0;
  try {
    let insightsUrl =
      `https://graph.facebook.com/v19.0/${pageId}/insights` +
      `?metric=page_impressions_unique,page_post_engagements&period=day&access_token=${token}`;
    if (since && until) insightsUrl += `&since=${since}&until=${until}`;
    const insightsRes = await fetch(insightsUrl);
    const insights = await insightsRes.json();
    for (const item of insights.data || []) {
      const total = (item.values || []).reduce((s, v) => s + (Number(v.value) || 0), 0);
      if (item.name === "page_impressions_unique") reach = total;
      if (item.name === "page_post_engagements") engagement = total;
    }
  } catch {}

  return {
    platform: "Facebook",
    username: profile.name,
    followers: Number(profile.followers_count || profile.fan_count || 0),
    posts: null,
    reach,
    engagement,
  };
}

function rangeToDates(range) {
  const now = new Date();
  const until = Math.floor(now.getTime() / 1000);
  let sinceDate = new Date(now);
  if (range === "today") sinceDate.setHours(0, 0, 0, 0);
  else if (range === "7d") sinceDate.setDate(now.getDate() - 7);
  else if (range === "30d") sinceDate.setDate(now.getDate() - 30);
  else if (range === "month") sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
  else return { since: null, until: null };
  return { since: Math.floor(sinceDate.getTime() / 1000), until };
}

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || "instagram";
  const range = searchParams.get("range") || "30d";
  const { since, until } = rangeToDates(range);

  const token = await getSetting("ig_access_token", "IG_ACCESS_TOKEN");
  const igAccountId = await getSetting("ig_business_account_id", "IG_BUSINESS_ACCOUNT_ID");
  const fbPageId = await getSetting("fb_page_id", "FB_PAGE_ID");

  if (!token) {
    return NextResponse.json({
      connected: false,
      platforms: [
        { platform: "Instagram", followers: 12450, posts: 18, reach: 98000, engagement: 4200 },
      ],
    });
  }

  try {
    if (platform === "facebook") {
      if (!fbPageId) {
        return NextResponse.json(
          { connected: false, error: "Facebook sahifa ID kiritilmagan. Sozlamalar bo'limida 'Facebook sahifa ID' maydonini to'ldiring.", platforms: [] },
          { status: 200 }
        );
      }
      const fb = await fetchFacebook(token, fbPageId, since, until);
      if (fb.error) return NextResponse.json({ connected: false, error: fb.error, platforms: [] }, { status: 200 });
      return NextResponse.json({ connected: true, platforms: [fb] });
    }

    if (!igAccountId) {
      return NextResponse.json(
        { connected: false, error: "Instagram business akkaunt ID kiritilmagan.", platforms: [] },
        { status: 200 }
      );
    }
    const ig = await fetchInstagram(token, igAccountId, since, until);
    if (ig.error) return NextResponse.json({ connected: false, error: ig.error, platforms: [] }, { status: 200 });
    return NextResponse.json({ connected: true, platforms: [ig] });
  } catch (e) {
    return NextResponse.json(
      { connected: false, error: `API bilan bog'lanib bo'lmadi: ${e.message}`, platforms: [] },
      { status: 200 }
    );
  }
}
