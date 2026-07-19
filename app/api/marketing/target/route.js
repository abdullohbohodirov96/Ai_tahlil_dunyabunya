import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting } from "../../../../lib/settings.js";

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
        { name: "Yoz aksiyasi", spend: 1250000, impressions: 84000, clicks: 2100, leads: 63 },
        { name: "Yangi mahsulot", spend: 780000, impressions: 51000, clicks: 1400, leads: 34 },
      ],
    });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";
  const datePreset = PRESETS[range] || "last_30d";

  const cleanAccountId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const url =
    `https://graph.facebook.com/v19.0/${cleanAccountId}/insights` +
    `?level=campaign&fields=campaign_name,spend,impressions,clicks,actions` +
    `&date_preset=${datePreset}&limit=50&access_token=${token}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { connected: false, error: `Meta API xatosi: ${data.error.message}`, campaigns: [] },
        { status: 200 }
      );
    }

    const campaigns = (data.data || []).map((row) => {
      const leadAction = (row.actions || []).find(
        (a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      return {
        name: row.campaign_name,
        spend: Number(row.spend || 0),
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        leads: Number(leadAction?.value || 0),
      };
    });

    return NextResponse.json({ connected: true, campaigns });
  } catch (e) {
    return NextResponse.json(
      { connected: false, error: `Meta API bilan bog'lanib bo'lmadi: ${e.message}`, campaigns: [] },
      { status: 200 }
    );
  }
}
