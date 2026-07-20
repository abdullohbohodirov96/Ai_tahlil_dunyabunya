import jwt from "jsonwebtoken";
import { query } from "./db.js";
import { getSetting } from "./settings.js";
import { getAssistantReply } from "./assistant.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function apiUrl(method) {
  const token = await getSetting("telegram_bot_token", "TELEGRAM_BOT_TOKEN");
  if (!token) return null;
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function tgSend(chatId, text, replyMarkup) {
  const url = await apiUrl("sendMessage");
  if (!url) {
    console.error("[telegram] tgSend: token topilmadi (sozlamalarda yo'q)");
    return;
  }
  const body = { chat_id: chatId, text };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("[telegram] tgSend xatosi:", data);
  }
}

// Vazifa haqida xabar yuboradi, ostida "Bajarildi" / "Jarayonda" tugmalari bilan
export async function tgSendTaskNotice(chatId, todo, prefix = "📌 Yangi vazifa") {
  const deadlineText = todo.deadline
    ? `\n⏰ Muddat: ${new Date(todo.deadline).toLocaleString("uz-UZ")}`
    : "";
  const text = `${prefix}: ${todo.title}${todo.description ? `\n${todo.description}` : ""}${deadlineText}`;
  await tgSend(chatId, text, {
    inline_keyboard: [
      [
        { text: "✅ Bajarildi", callback_data: `todo_done_${todo.id}` },
        { text: "🔄 Jarayonda", callback_data: `todo_progress_${todo.id}` },
      ],
    ],
  });
}

async function answerCallback(callbackId, text) {
  const url = await apiUrl("answerCallbackQuery");
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: false }),
  });
}

async function handleCallback(cb) {
  const data = cb.data || "";
  const match = data.match(/^todo_(done|progress)_(\d+)$/);
  if (!match) {
    await answerCallback(cb.id, "Noma'lum amal");
    return;
  }
  const [, action, todoId] = match;
  const status = action === "done" ? "bajarildi" : "jarayonda";
  const label = action === "done" ? "✅ Bajarildi deb belgilandi" : "🔄 Jarayonda deb belgilandi";

  await query("UPDATE todos SET status = $1 WHERE id = $2", [status, todoId]);
  await answerCallback(cb.id, label);
  await tgSend(cb.message.chat.id, `${label}: vazifa yangilandi.`);
}

export async function getBotUsername() {
  const configured = await getSetting("telegram_bot_username", "TELEGRAM_BOT_USERNAME");
  if (configured) return configured;
  const url = await apiUrl("getMe");
  if (!url) return null;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data?.result?.username || null;
  } catch {
    return null;
  }
}

export async function hasTelegramToken() {
  const token = await getSetting("telegram_bot_token", "TELEGRAM_BOT_TOKEN");
  return !!token;
}

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
    if (!fields.length) return existing.rows[0].id;
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
  const callback = update.callback_query;

  try {
    if (callback) {
      await handleCallback(callback);
      return;
    }
    if (!msg) return;
    await handleMessage(msg);
  } catch (e) {
    console.error("[telegram] handleUpdate xatosi:", e);
    const chatId = msg?.chat?.id || callback?.message?.chat?.id;
    if (chatId) {
      try {
        await tgSend(chatId, `⚠️ Ichki xatolik: ${e.message}`);
      } catch {
        // tgSend o'zi ham ishlamasa, hech narsa qilib bo'lmaydi
      }
    }
  }
}

async function handleMessage(msg) {

  if (msg.text?.startsWith("/start")) {
    const parts = msg.text.trim().split(/\s+/);
    const payload = parts[1];

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
          `✅ Akkountingiz muvaffaqiyatli bog'landi${name ? `: ${name}` : ""}!\n\nEndi sizga shaxsiy vazifalar shu yerga keladi.\n\nBuyruqlar:\n/vazifalar — sizga berilgan vazifalar\n\nShuningdek, menga xohlagan savolingizni yozishingiz mumkin — men JARVIS AI-assistentiman.`
        );
        return;
      } else {
        await tgSend(msg.chat.id, "Bog'lash kodi eskirgan yoki noto'g'ri. Web tizimdan yangi link oling.");
        return;
      }
    }

    await tgSend(
      msg.chat.id,
      `Salom, ${msg.chat.first_name || ""}! 👋 Men JARVIS — sizning biznesingizning AI-assistentiman.\n\n` +
        `Men quyidagilarni qila olaman:\n` +
        `• Savolingizga javob berish (shunchaki yozing)\n` +
        `• /vazifalar — sizga berilgan vazifalarni ko'rsatish\n\n` +
        `Agar bu tizimning xodimi bo'lsangiz, admin sizga tez orada rol beradi yoki siz web tizimdagi "Telegram ulash" tugmasi orqali akkountingizni bog'lashingiz mumkin.`
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

  // Boshqa har qanday matnli xabar — AI-assistentga yuboriladi
  if (msg.text && !msg.text.startsWith("/")) {
    await upsertUser(msg.chat, {});
    const result = await getAssistantReply(msg.text);
    await tgSend(msg.chat.id, result.reply || `Xatolik: ${result.error}`);
  }
}
