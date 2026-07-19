import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth.js";
import { createLinkToken, getBotUsername } from "../../../../../lib/telegram.js";

export async function POST(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Telegram bot hali sozlanmagan (TELEGRAM_BOT_TOKEN yo'q)" },
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
