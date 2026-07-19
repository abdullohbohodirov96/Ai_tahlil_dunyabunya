import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;
  return NextResponse.json({ user });
}
