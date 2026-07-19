import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

// GET ?month=YYYY-MM — shu oyning barcha kunlik rejalari
export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const res = await query(
    `SELECT * FROM content_plan
     WHERE to_char(day, 'YYYY-MM') = $1
     ORDER BY day`,
    [month]
  );
  return NextResponse.json(res.rows);
}

// POST { day, stories_count, posts_count, carousels_count, note } — kun rejasini yaratish/yangilash
export async function POST(req) {
  const { user, error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  const { day, stories_count, posts_count, carousels_count, note } = await req.json();
  if (!day) return NextResponse.json({ error: "Sana kerak" }, { status: 400 });

  await query(
    `INSERT INTO content_plan (day, stories_count, posts_count, carousels_count, note, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (day) DO UPDATE SET
       stories_count = excluded.stories_count,
       posts_count = excluded.posts_count,
       carousels_count = excluded.carousels_count,
       note = excluded.note`,
    [day, stories_count || 0, posts_count || 0, carousels_count || 0, note || null, user.id]
  );
  return NextResponse.json({ ok: true });
}

// DELETE ?day=YYYY-MM-DD
export async function DELETE(req) {
  const { error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");
  if (!day) return NextResponse.json({ error: "Sana kerak" }, { status: 400 });
  await query("DELETE FROM content_plan WHERE day = $1", [day]);
  return NextResponse.json({ ok: true });
}
