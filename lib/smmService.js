// Instagram akkaunt darajasidagi insights (davr bilan)
export async function fetchInstagram(token, accountId, since, until) {
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
export async function fetchFacebook(token, pageId, since, until) {
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

export function rangeToDates(range) {
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
