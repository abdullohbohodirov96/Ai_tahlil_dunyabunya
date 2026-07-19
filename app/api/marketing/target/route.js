import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting } from "../../../../lib/settings.js";

export const dynamic = "force-dynamic";

const PRESETS = {
  today: "today",
  "7d": "last_7d",
  "30d": "last_30d",
  month: "this_month",
};

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const token = await getSetting("meta_ads_access_token", "META_ADS_ACCESS_TOKEN");
  const accountId = await getSetting("meta_ads_account_id", "META_ADS_ACCOUNT_ID");

  if (!token || !accountId) {
    return NextResponse.json({
      connected: false,
      campaigns: [
        { name: "Yoz aksiyasi", spend: 1250, impressions: 84000, clicks: 2100, leads: 63 },
        { name: "Yangi mahsulot", spend: 780, impressions: 51000, clicks: 1400, leads: 34 },
      ],
      daily: [],
    });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";
  const datePreset = PRESETS[range] || "last_30d";
  const cleanAccountId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;

  try {
    // 1) Faqat AKTIV kampaniyalar ro'yxatini olamiz
    const campaignsUrl =
      `https://graph.facebook.com/v19.0/${cleanAccountId}/campaigns` +
      `?fields=id,name,effective_status&effective_status=["ACTIVE"]&limit=200&access_token=${token}`;
    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      return NextResponse.json(
        { connected: false, error: `Meta API xatosi: ${campaignsData.error.message}`, campaigns: [], daily: [] },
        { status: 200 }
      );
    }

    const activeIds = (campaignsData.data || []).map((c) => c.id);
    if (!activeIds.length) {
      return NextResponse.json({ connected: true, campaigns: [], daily: [] });
    }

    // 2) Shu aktiv kampaniyalar bo'yicha kunlik (time_increment=1) statistika
    const filtering = encodeURIComponent(JSON.stringify([{ field: "campaign.id", operator: "IN", value: activeIds }]));
    const insightsUrl =
      `https://graph.facebook.com/v19.0/${cleanAccountId}/insights` +
      `?level=campaign&fields=campaign_name,spend,impressions,clicks,actions,date_start` +
      `&time_increment=1&date_preset=${datePreset}&filtering=${filtering}&limit=500&access_token=${token}`;
    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (insightsData.error) {
      return NextResponse.json(
        { connected: false, error: `Meta API xatosi: ${insightsData.error.message}`, campaigns: [], daily: [] },
        { status: 200 }
      );
    }

    const rows = insightsData.data || [];

    // Kampaniya bo'yicha jamlash (jadval uchun)
    const byCampaign = {};
    // Kun bo'yicha jamlash (kunlik xarajat uchun)
    const byDay = {};

    for (const row of rows) {
      const leadAction = (row.actions || []).find(
        (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      const spend = Number(row.spend || 0);
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const leads = Number(leadAction?.value || 0);

      if (!byCampaign[row.campaign_name]) {
        byCampaign[row.campaign_name] = { name: row.campaign_name, spend: 0, impressions: 0, clicks: 0, leads: 0 };
      }
      byCampaign[row.campaign_name].spend += spend;
      byCampaign[row.campaign_name].impressions += impressions;
      byCampaign[row.campaign_name].clicks += clicks;
      byCampaign[row.campaign_name].leads += leads;

      if (!byDay[row.date_start]) byDay[row.date_start] = 0;
      byDay[row.date_start] += spend;
    }

    const campaigns = Object.values(byCampaign);
    const daily = Object.entries(byDay)
      .map(([day, spend]) => ({ day, spend }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));

    return NextResponse.json({ connected: true, campaigns, daily });
  } catch (e) {
    return NextResponse.json(
      { connected: false, error: `Meta API bilan bog'lanib bo'lmadi: ${e.message}`, campaigns: [], daily: [] },
      { status: 200 }
    );
  }
}
