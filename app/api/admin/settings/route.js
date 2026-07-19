import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting, setSetting, SETTINGS_MAP } from "../../../../lib/settings.js";

export const dynamic = "force-dynamic";

// Admin panelda ko'rsatish uchun — qiymatlarni to'liq qaytarmasdan, faqat
// "sozlangan/sozlanmagan" holatini va oxirgi bir necha belgisini ko'rsatadi.
export async function GET(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const result = {};
  for (const [dbKey, envKey] of Object.entries(SETTINGS_MAP)) {
    const value = await getSetting(dbKey, envKey);
    result[dbKey] = value
      ? { set: true, preview: value.length > 8 ? `...${value.slice(-6)}` : "•••" }
      : { set: false, preview: null };
  }
  return NextResponse.json(result);
}

export async function POST(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { key, value } = await req.json();
  if (!key || !(key in SETTINGS_MAP)) {
    return NextResponse.json({ error: "Noto'g'ri sozlama kaliti" }, { status: 400 });
  }
  await setSetting(key, value ?? "");
  return NextResponse.json({ ok: true });
}
