import { query } from "./db.js";

const API = (method) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

export async function tgSend(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(API("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function upsertUser(chat, patch) {
  const telegramId = String(chat.id);
  const existing = await query("SELECT * FROM tg_users WHERE telegram_id = $1", [telegramId]);
  if (existing.rows.length) {
    const fields = Object.keys(patch);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    await query(
      `UPDATE tg_users SET ${setClause} WHERE telegram_id = $1`,
      [telegramId, ...fields.map((f) => patch[f])]
    );
    return existing.rows[0].id;
  } else {
    const res = await query(
      `INSERT INTO tg_users (telegram_id, username, first_name, started_bot, joined_group, group_title)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        telegramId,
        chat.username || null,
        chat.first_name || null,
        patch.started_bot || false,
        patch.joined_group || false,
        patch.group_title || null,
      ]
    );
    return res.rows[0].id;
  }
}

// Telegramdan kelgan har bir Update obyektini qayta ishlaydi (webhook orqali chaqiriladi)
export async function handleUpdate(update) {
  const msg = update.message;
  if (!msg) return;

  if (msg.text === "/start") {
    await upsertUser(msg.chat, { started_bot: true });
    await tgSend(
      msg.chat.id,
      `Assalomu alaykum, ${msg.chat.first_name || ""}! Siz tizimga muvaffaqiyatli qo'shildingiz.\n\nBuyruqlar:\n/vazifalar — sizga berilgan vazifalar`
    );
    return;
  }

  if (msg.text === "/vazifalar") {
    const userRes = await query("SELECT * FROM tg_users WHERE telegram_id = $1", [String(msg.chat.id)]);
    if (!userRes.rows.length) {
      await tgSend(msg.chat.id, "Avval /start bosing.");
      return;
    }
    const tasksRes = await query(
      "SELECT * FROM tg_tasks WHERE tg_user_id = $1 ORDER BY id DESC",
      [userRes.rows[0].id]
    );
    if (!tasksRes.rows.length) {
      await tgSend(msg.chat.id, "Hozircha vazifalar yo'q.");
      return;
    }
    const text = tasksRes.rows.map((t, i) => `${i + 1}. [${t.status}] ${t.title}`).join("\n");
    await tgSend(msg.chat.id, text);
    return;
  }

  if (msg.new_chat_members?.length) {
    for (const member of msg.new_chat_members) {
      await upsertUser(
        { id: member.id, username: member.username, first_name: member.first_name },
        { joined_group: true, group_title: msg.chat.title }
      );
    }
  }
}
