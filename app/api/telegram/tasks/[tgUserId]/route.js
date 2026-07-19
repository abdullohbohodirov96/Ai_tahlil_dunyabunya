import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db.js";
import { requireAuth } from "../../../../../lib/auth.js";

export async function GET(req, { params }) {
  const { error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  const res = await query(
    "SELECT * FROM tg_tasks WHERE tg_user_id = $1 ORDER BY id DESC",
    [params.tgUserId]
  );
  return NextResponse.json(res.rows);
}
