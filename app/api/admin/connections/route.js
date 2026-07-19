import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting } from "../../../../lib/settings.js";

export const dynamic = "force-dynamic";

async function checkTelegram() {
  const token = await getSetting("telegram_bot_token", "TELEGRAM_BOT_TOKEN");
  if (!token) return { connected: false, detail: "Bot tokeni sozlanmagan" };
  return { connected: true, detail: "Token topildi" };
}

async function checkGoogleSheets() {
  const key = await getSetting("google_service_account_json", "GOOGLE_SERVICE_ACCOUNT_JSON");
  const sheetId = await getSetting("google_sheet_id", "SALES_SHEET_ID");
  if (!key && !sheetId) {
    return { connected: false, detail: "Service account kaliti va Sheet ID sozlanmagan" };
  }
  if (!key) return { connected: false, detail: "Service account kaliti sozlanmagan" };
  if (!sheetId) return { connected: false, detail: "Sheet ID sozlanmagan" };
  try {
    const parsed = JSON.parse(key);
    if (!parsed.client_email || !parsed.private_key) {
      return { connected: false, detail: "Kalit to'liq emas (client_email yoki private_key yo'q)" };
    }
    return { connected: true, detail: `Ulangan: ${parsed.client_email}` };
  } catch {
    return { connected: false, detail: "Kalit noto'g'ri JSON formatida" };
  }
}

async function checkMetaAds() {
  const token = await getSetting("meta_ads_access_token", "META_ADS_ACCESS_TOKEN");
  const accountId = await getSetting("meta_ads_account_id", "META_ADS_ACCOUNT_ID");
  if (!token && !accountId) return { connected: false, detail: "Token va akkaunt ID sozlanmagan" };
  if (!token) return { connected: false, detail: "Token sozlanmagan" };
  if (!accountId) return { connected: false, detail: "Akkaunt ID sozlanmagan" };
  return {
    connected: true,
    detail: "Token va akkaunt ID topildi (haqiqiy Meta API chaqiruvi hali yozilmagan)",
  };
}

async function checkInstagram() {
  const token = await getSetting("ig_access_token", "IG_ACCESS_TOKEN");
  const accountId = await getSetting("ig_business_account_id", "IG_BUSINESS_ACCOUNT_ID");
  if (!token && !accountId) return { connected: false, detail: "Token va akkaunt ID sozlanmagan" };
  if (!token) return { connected: false, detail: "Token sozlanmagan" };
  if (!accountId) return { connected: false, detail: "Akkaunt ID sozlanmagan" };
  return {
    connected: true,
    detail: "Token va akkaunt ID topildi (haqiqiy Instagram API chaqiruvi hali yozilmagan)",
  };
}

export async function GET(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const [telegram, sheets, meta, ig] = await Promise.all([
    checkTelegram(),
    checkGoogleSheets(),
    checkMetaAds(),
    checkInstagram(),
  ]);

  const results = [
    { service: "telegram", label: "Telegram Bot", ...telegram },
    { service: "google_sheets", label: "Google Sheets", ...sheets },
    { service: "meta_ads", label: "Meta Ads (Target)", ...meta },
    { service: "instagram", label: "Instagram (SMM)", ...ig },
  ];

  return NextResponse.json(results);
}
