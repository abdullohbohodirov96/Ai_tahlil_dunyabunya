import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";

// Bu endpoint endi bazadagi eski bayroqqa emas, balki HAQIQIY environment
// o'zgaruvchilariga qarab holatni hisoblaydi — shuning uchun Vercel'da token
// qo'ysangiz, qayta deploy qilingandan keyin darhol "Ulangan" ko'rinadi.
function checkTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { connected: false, detail: "TELEGRAM_BOT_TOKEN sozlanmagan" };
  return { connected: true, detail: "Token topildi" };
}

function checkGoogleSheets() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.SALES_SHEET_ID;
  if (!key && !sheetId) {
    return { connected: false, detail: "GOOGLE_SERVICE_ACCOUNT_JSON va SALES_SHEET_ID sozlanmagan" };
  }
  if (!key) return { connected: false, detail: "GOOGLE_SERVICE_ACCOUNT_JSON sozlanmagan" };
  if (!sheetId) return { connected: false, detail: "SALES_SHEET_ID sozlanmagan" };
  try {
    const parsed = JSON.parse(key);
    if (!parsed.client_email || !parsed.private_key) {
      return { connected: false, detail: "GOOGLE_SERVICE_ACCOUNT_JSON to'liq emas (client_email yoki private_key yo'q)" };
    }
    return { connected: true, detail: `Ulangan: ${parsed.client_email}` };
  } catch {
    return { connected: false, detail: "GOOGLE_SERVICE_ACCOUNT_JSON noto'g'ri JSON formatida" };
  }
}

function checkMetaAds() {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;
  if (!token && !accountId) {
    return { connected: false, detail: "META_ADS_ACCESS_TOKEN va META_ADS_ACCOUNT_ID sozlanmagan" };
  }
  if (!token) return { connected: false, detail: "META_ADS_ACCESS_TOKEN sozlanmagan" };
  if (!accountId) return { connected: false, detail: "META_ADS_ACCOUNT_ID sozlanmagan" };
  return {
    connected: true,
    detail: "Token va akkaunt ID topildi (haqiqiy Meta API chaqiruvi hali yozilmagan — hozircha DB'dan bo'sh natija qaytadi)",
  };
}

function checkInstagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  const accountId = process.env.IG_BUSINESS_ACCOUNT_ID;
  if (!token && !accountId) {
    return { connected: false, detail: "IG_ACCESS_TOKEN va IG_BUSINESS_ACCOUNT_ID sozlanmagan" };
  }
  if (!token) return { connected: false, detail: "IG_ACCESS_TOKEN sozlanmagan" };
  if (!accountId) return { connected: false, detail: "IG_BUSINESS_ACCOUNT_ID sozlanmagan" };
  return {
    connected: true,
    detail: "Token va akkaunt ID topildi (haqiqiy Instagram API chaqiruvi hali yozilmagan — hozircha DB'dan bo'sh natija qaytadi)",
  };
}

export async function GET(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const results = [
    { service: "telegram", label: "Telegram Bot", ...checkTelegram() },
    { service: "google_sheets", label: "Google Sheets", ...checkGoogleSheets() },
    { service: "meta_ads", label: "Meta Ads (Target)", ...checkMetaAds() },
    { service: "instagram", label: "Instagram (SMM)", ...checkInstagram() },
  ];

  return NextResponse.json(results);
}
