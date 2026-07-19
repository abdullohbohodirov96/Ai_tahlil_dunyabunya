import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth.js";
import { createLinkToken, getBotUsername, hasTelegramToken } from "../../../../../lib/telegram.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  if (!(await hasTelegramToken())) {
    return NextResponse.json(
      { error: "Telegram bot hali sozlanmagan. Sozlamalar bo'limida token kiriting." },
      { status: 400 }
    );
  }

  const username = await getBotUsername();
  if (!username) {
    return NextResponse.json(
      { error: "Bot username aniqlanmadi. TELEGRAM_BOT_TOKEN to'g'riligini tekshiring." },
      { status: 400 }
    );
  }

  const token = createLinkToken(user.id);
  const deepLink = `https://t.me/${username}?start=${token}`;

  return NextResponse.json({ deepLink, botUsername: username, expiresInMinutes: 15 });
}
