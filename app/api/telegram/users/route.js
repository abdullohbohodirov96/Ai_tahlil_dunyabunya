import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export async function GET(req) {
  const { error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const started = searchParams.get("started");
  const joined = searchParams.get("joined");
  const status = searchParams.get("status");

  let sql = `
    SELECT tg.*, u.full_name AS linked_full_name, u.username AS linked_username
    FROM tg_users tg
    LEFT JOIN users u ON u.id = tg.linked_user_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;
  if (started !== null) {
    sql += ` AND started_bot = $${idx++}`;
    params.push(started === "true");
  }
  if (joined !== null) {
    sql += ` AND joined_group = $${idx++}`;
    params.push(joined === "true");
  }
  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }
  sql += " ORDER BY id DESC";

  const res = await query(sql, params);
  return NextResponse.json(res.rows);
}
