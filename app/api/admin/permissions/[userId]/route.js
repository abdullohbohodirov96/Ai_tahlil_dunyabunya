import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export async function GET(req, { params }) {
  const { error } = requireAuth(req, "admin");
  if (error) return error;

  const res = await query(
    "SELECT * FROM account_permissions WHERE user_id = $1",
    [params.userId]
  );
  return NextResponse.json(res.rows);
}
