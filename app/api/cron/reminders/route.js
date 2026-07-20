import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { tgSend, tgSendTaskNotice } from "../../../../lib/telegram.js";
import { getSetting } from "../../../../lib/settings.js";
import { fetchInstagram, fetchFacebook } from "../../../../lib/smmService.js";

export const dynamic = "force-dynamic";

async function snapshotSmm(today) {
  const token = await getSetting("ig_access_token", "IG_ACCESS_TOKEN");
  if (!token) return;

  const igAccountId = await getSetting("ig_business_account_id", "IG_BUSINESS_ACCOUNT_ID");
  if (igAccountId) {
    const ig = await fetchInstagram(token, igAccountId, null, null);
    if (!ig.error) {
      await query(
        `INSERT INTO smm_daily_stats (platform, day, followers, posts, reach, engagement)
         VALUES ('instagram', $1, $2, $3, $4, $5)
         ON CONFLICT (platform, day) DO UPDATE SET
           followers = excluded.followers, posts = excluded.posts,
           reach = excluded.reach, engagement = excluded.engagement`,
        [today, ig.followers, ig.posts, ig.reach, ig.engagement]
      );
    }
  }

  const fbPageId = await getSetting("fb_page_id", "FB_PAGE_ID");
  if (fbPageId) {
    const fb = await fetchFacebook(token, fbPageId, null, null);
    if (!fb.error) {
      await query(
        `INSERT INTO smm_daily_stats (platform, day, followers, posts, reach, engagement)
         VALUES ('facebook', $1, $2, $3, $4, $5)
         ON CONFLICT (platform, day) DO UPDATE SET
           followers = excluded.followers, reach = excluded.reach, engagement = excluded.engagement`,
        [today, fb.followers, null, fb.reach, fb.engagement]
      );
    }
  }
}

// Bu endpoint Vercel Cron tomonidan muntazam (soatiga bir) chaqiriladi — vercel.json'da sozlangan.
// Qo'lda ham chaqirsa bo'ladi: GET /api/cron/reminders
export async function GET() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let sent = 0;

  await snapshotSmm(today);

  // 1) Bajarilmagan, deadline'li vazifalar uchun eslatmalar
  const todos = await query(`
    SELECT t.*, tg.telegram_id
    FROM todos t
    LEFT JOIN tg_users tg ON tg.linked_user_id = t.assignee_id
    WHERE t.status != 'bajarildi' AND t.deadline IS NOT NULL AND tg.telegram_id IS NOT NULL
  `);

  for (const todo of todos.rows) {
    const deadline = new Date(todo.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);

    // Kunlik eslatma (kuniga bir marta) — tugmalar bilan, to'g'ridan-to'g'ri javob berish mumkin
    if (hoursLeft > 0 && todo.last_daily_reminder !== today) {
      await tgSendTaskNotice(todo.telegram_id, todo, "🔔 Eslatma — hali bajarilmagan");
      await query("UPDATE todos SET last_daily_reminder = $1 WHERE id = $2", [today, todo.id]);
      sent++;
    }

    // 5 soat qolganda (bir marta)
    if (hoursLeft > 0 && hoursLeft <= 5 && !todo.reminded_5h) {
      await tgSendTaskNotice(todo.telegram_id, todo, "⚠️ 5 soatdan kam vaqt qoldi");
      await query("UPDATE todos SET reminded_5h = true WHERE id = $1", [todo.id]);
      sent++;
    }

    // 1 soat qolganda (bir marta)
    if (hoursLeft > 0 && hoursLeft <= 1 && !todo.reminded_1h) {
      await tgSendTaskNotice(todo.telegram_id, todo, "🚨 SHOSHILINCH — 1 soatdan kam vaqt qoldi");
      await query("UPDATE todos SET reminded_1h = true WHERE id = $1", [todo.id]);
      sent++;
    }
  }

  // 2) Bugungi qayta aloqa (follow-up) leadlari uchun menejerga eslatma
  const followUps = await query(`
    SELECT l.id, l.full_name, l.phone, l.follow_up_date, tg.telegram_id
    FROM leads l
    LEFT JOIN tg_users tg ON tg.linked_user_id = l.manager_id
    WHERE l.follow_up_date::date = $1::date
      AND l.sold = false
      AND l.follow_up_reminded = false
      AND tg.telegram_id IS NOT NULL
  `, [today]);

  for (const lead of followUps.rows) {
    await tgSend(
      lead.telegram_id,
      `📞 Bugun qayta aloqa: ${lead.full_name} (${lead.phone})\nCRM'da izohlarini ko'rib chiqing.`
    );
    await query("UPDATE leads SET follow_up_reminded = true WHERE id = $1", [lead.id]);
    sent++;
  }

  // 3) Bugungi kontent-reja bo'yicha SMM xodimlariga eslatma (kuniga bir marta)
  const plan = await query(
    `SELECT * FROM content_plan WHERE day = $1::date AND (last_reminder_sent IS NULL OR last_reminder_sent != $1::date)`,
    [today]
  );
  if (plan.rows.length) {
    const p = plan.rows[0];
    const smmUsers = await query(`
      SELECT tg.telegram_id FROM users u
      JOIN tg_users tg ON tg.linked_user_id = u.id
      WHERE u.role = 'smm' AND u.active = true
    `);
    if (smmUsers.rows.length) {
      const text =
        `📅 Bugungi kontent-reja:\n` +
        `• Storis: ${p.stories_count} ta\n` +
        `• Post: ${p.posts_count} ta\n` +
        `• Carousel: ${p.carousels_count} ta` +
        (p.note ? `\n📝 ${p.note}` : "");
      for (const su of smmUsers.rows) {
        await tgSend(su.telegram_id, text);
        sent++;
      }
      await query("UPDATE content_plan SET last_reminder_sent = $1 WHERE id = $2", [today, p.id]);
    }
  }

  return NextResponse.json({ ok: true, sent, time: now.toISOString() });
}
