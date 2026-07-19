import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getAssistantReply } from "../../../../lib/assistant.js";

export async function POST(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "Xabar matni kerak" }, { status: 400 });

  const result = await getAssistantReply(message);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ reply: result.reply });
}
