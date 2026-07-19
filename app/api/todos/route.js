import { NextResponse } from "next/server";
import { query } from "../../../lib/db.js";
import { requireAuth } from "../../../lib/auth.js";
import { tgSend } from "../../../lib/telegram.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { user, error } = requireAuth(req);
  if (error) return error;

  let res;
  if (user.role === "admin" || user.role === "marketing_head") {
    res = await query(`
      SELECT t.*, u.full_name as assignee_name, c.full_name as creator_name
      FROM todos t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users c ON c.id = t.created_by
      ORDER BY t.status = 'bajarildi', t.deadline NULLS LAST, t.id DESC
    `);
  } else {
    res = await query(`
      SELECT t.*, u.full_name as assignee_name, c.full_name as creator_name
      FROM todos t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.assignee_id = $1
      ORDER BY t.status = 'bajarildi', t.deadline NULLS LAST, t.id DESC
    `, [user.id]);
  }
  return NextResponse.json(res.rows);
}

export async function POST(req) {
  const { user, error } = requireAuth(req, "admin", "marketing_head");
  if (error) return error;

  const { title, description, assignee_id, deadline } = await req.json();
  if (!title || !assignee_id) {
    return NextResponse.json({ error: "Sarlavha va mas'ul xodim kerak" }, { status: 400 });
  }

  const res = await query(
    `INSERT INTO todos (title, description, assignee_id, created_by, deadline)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [title, description || null, assignee_id, user.id, deadline || null]
  );

  // Mas'ul xodimning Telegram akkaunti bog'langan bo'lsa, darhol xabar yuboramiz
  const tg = await query("SELECT telegram_id FROM tg_users WHERE linked_user_id = $1", [assignee_id]);
  if (tg.rows.length) {
    const deadlineText = deadline ? `\n⏰ Muddat: ${new Date(deadline).toLocaleString("uz-UZ")}` : "";
    await tgSend(tg.rows[0].telegram_id, `📌 Yangi vazifa: ${title}${description ? `\n${description}` : ""}${deadlineText}`);
  }

  return NextResponse.json({ id: res.rows[0].id, ok: true });
}
