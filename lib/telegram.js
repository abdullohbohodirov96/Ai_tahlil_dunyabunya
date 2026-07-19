import jwt from "jsonwebtoken";
import { query } from "./db.js";

const API = (method) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function tgSend(chatId, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(API("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

// Botning @username'ini oladi — deep-link (t.me/username?start=...) yaratish uchun kerak.
// Agar TELEGRAM_BOT_USERNAME .env'da qo'lda kiritilgan bo'lsa, o'shani ishlatadi (tezroq);
// aks holda Telegramdan getMe orqali so'raydi.
export async function getBotUsername() {
  if (process.env.TELEGRAM_BOT_USERNAME) return process.env.TELEGRAM_BOT_USERNAME;
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(API("getMe"));
    const data = await res.json();
    return data?.result?.username || null;
  } catch {
    return null;
  }
}

// Web'dagi foydalanuvchi uchun bir martalik, 15 daqiqa amal qiladigan bog'lash kodi yaratadi
export function createLinkToken(userId) {
  return jwt.sign({ linkUserId: userId }, JWT_SECRET, { expiresIn: "15m" });
}

function verifyLinkToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.linkUserId || null;
  } catch {
    return null;
  }
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
      `INSERT INTO tg_users (telegram_id, username, first_name, started_bot, joined_group, group_title, linked_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        telegramId,
        chat.username || null,
        chat.first_name || null,
        patch.started_bot || false,
        patch.joined_group || false,
        patch.group_title || null,
        patch.linked_user_id || null,
      ]
    );
    return res.rows[0].id;
  }
}

// Telegramdan kelgan har bir Update obyektini qayta ishlaydi (webhook orqali chaqiriladi)
export async function handleUpdate(update) {
  const msg = update.message;
  if (!msg) return;

  if (msg.text?.startsWith("/start")) {
    const parts = msg.text.trim().split(/\s+/);
    const payload = parts[1]; // deep-link orqali kelgan bog'lash kodi (bo'lishi mumkin yoki yo'q)

    await upsertUser(msg.chat, { started_bot: true });

    if (payload) {
      const linkUserId = verifyLinkToken(payload);
      if (linkUserId) {
        const userRes = await query("SELECT full_name FROM users WHERE id = $1", [linkUserId]);
        await query(
          "UPDATE tg_users SET linked_user_id = $1 WHERE telegram_id = $2",
          [linkUserId, String(msg.chat.id)]
        );
        const name = userRes.rows[0]?.full_name || "";
        await tgSend(
          msg.chat.id,
          `✅ Akkountingiz muvaffaqiyatli bog'landi${name ? `: ${name}` : ""}!\n\nEndi sizga shaxsiy vazifalar shu yerga keladi.\n\nBuyruqlar:\n/vazifalar — sizga berilgan vazifalar`
        );
        return;
      } else {
        await tgSend(msg.chat.id, "Bog'lash kodi eskirgan yoki noto'g'ri. Web tizimdan yangi link oling.");
        return;
      }
    }

    await tgSend(
      msg.chat.id,
      `Assalomu alaykum, ${msg.chat.first_name || ""}! Siz tizimga muvaffaqiyatli qo'shildingiz.\n\nBuyruqlar:\n/vazifalar — sizga berilgan vazifalar\n\nAgar xodim bo'lsangiz, akkountingizni bog'lash uchun web tizimdagi "Telegram ulash" tugmasidan foydalaning.`
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
