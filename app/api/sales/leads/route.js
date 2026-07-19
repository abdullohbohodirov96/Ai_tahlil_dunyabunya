import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  let res;
  if (user.role === "sales_manager") {
    res = await query("SELECT * FROM leads WHERE manager_id = $1 ORDER BY id DESC", [user.id]);
  } else {
    res = await query("SELECT * FROM leads ORDER BY id DESC");
  }
  return NextResponse.json(res.rows);
}
