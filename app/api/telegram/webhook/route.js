import { NextResponse } from "next/server";
import { handleUpdate } from "../../../../lib/telegram.js";

export const dynamic = "force-dynamic";

// Telegram bu manzilga har bir yangi xabar/hodisani yuboradi (webhook rejimi).
// Deploy qilingandan keyin bir marta sozlash kerak — README-VERCEL.md ga qarang.
export async function POST(req) {
  try {
    const update = await req.json();
    await handleUpdate(update);
  } catch (e) {
    console.error("[telegram webhook]", e);
  }
  // Telegramga har doim 200 qaytarish kerak, aks holda qayta-qayta yuboraveradi
  return NextResponse.json({ ok: true });
}
