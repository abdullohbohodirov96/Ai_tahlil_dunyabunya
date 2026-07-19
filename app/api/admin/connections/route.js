import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export async function GET(req) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;
  const res = await query("SELECT * FROM api_connections");
  return NextResponse.json(res.rows);
}
