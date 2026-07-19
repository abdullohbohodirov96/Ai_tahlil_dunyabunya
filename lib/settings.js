import { query } from "./db.js";

// Sozlamalar avval bazadan (webdan kiritilgan), topilmasa environment
// o'zgaruvchisidan o'qiladi. Shu tufayli admin panelidan token kiritilsa,
// darhol ishlaydi — Vercel'da qayta deploy qilish shart emas.
export async function getSetting(dbKey, envVarName) {
  try {
    const res = await query("SELECT value FROM app_settings WHERE key = $1", [dbKey]);
    if (res.rows.length && res.rows[0].value) return res.rows[0].value;
  } catch {
    // jadval hali yo'q bo'lsa ham tizim yiqilmasin
  }
  return envVarName ? process.env[envVarName] || null : null;
}

export async function setSetting(dbKey, value) {
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
    [dbKey, value]
  );
}

export const SETTINGS_MAP = {
  telegram_bot_token: "TELEGRAM_BOT_TOKEN",
  telegram_bot_username: "TELEGRAM_BOT_USERNAME",
  google_service_account_json: "GOOGLE_SERVICE_ACCOUNT_JSON",
  google_sheet_id: "SALES_SHEET_ID",
  google_sheet_range: "SALES_SHEET_RANGE",
  google_sheet_col_name: null,
  google_sheet_col_phone: null,
  google_sheet_col_phone_alt: null,
  google_sheet_col_source: null,
  google_sheet_col_source_extra: null,
  meta_ads_access_token: "META_ADS_ACCESS_TOKEN",
  meta_ads_account_id: "META_ADS_ACCOUNT_ID",
  ig_access_token: "IG_ACCESS_TOKEN",
  ig_business_account_id: "IG_BUSINESS_ACCOUNT_ID",
  anthropic_api_key: "ANTHROPIC_API_KEY",
};
