import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export async function PATCH(req, { params }) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const { connected, meta } = await req.json();
  await query(
    "UPDATE api_connections SET connected = $1, meta = $2, updated_at = now() WHERE service = $3",
    [!!connected, JSON.stringify(meta || {}), params.service]
  );
  return NextResponse.json({ ok: true });
}
