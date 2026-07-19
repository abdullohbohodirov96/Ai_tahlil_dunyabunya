import { NextResponse } from "next/server";
import { query } from "../../../../lib/db.js";
import { requireAuth } from "../../../../lib/auth.js";

async function buildContext() {
  const today = new Date().toISOString().slice(0, 10);

  const perManager = await query(`
    SELECT u.full_name,
           COUNT(l.id) as total_leads,
           SUM(CASE WHEN l.status='sifatli' THEN 1 ELSE 0 END) as sales
    FROM users u LEFT JOIN leads l ON l.manager_id = u.id
    WHERE u.role = 'sales_manager' GROUP BY u.id
  `);

  const dailyToday = await query(
    "SELECT SUM(leads_count) as leads, SUM(sales_count) as sales FROM sales_daily WHERE day = $1",
    [today]
  );

  const tgCount = await query("SELECT COUNT(*) c FROM tg_users");
  const tgJoined = await query("SELECT COUNT(*) c FROM tg_users WHERE joined_group = true");
  const employees = await query("SELECT full_name, role, active FROM users");

  return {
    bugungi_sana: today,
    bugungi_leadlar: dailyToday.rows[0]?.leads || 0,
    bugungi_sotuvlar: dailyToday.rows[0]?.sales || 0,
    menejerlar_boyicha: perManager.rows,
    telegram_foydalanuvchilar: Number(tgCount.rows[0].c),
    telegram_gruppaga_qoshilgan: Number(tgJoined.rows[0].c),
    xodimlar: employees.rows,
  };
}

export async function POST(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "Xabar matni kerak" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const context = await buildContext();

  if (!apiKey) {
    return NextResponse.json({
      reply:
        `AI-assistent hali to'liq ulanmagan (ANTHROPIC_API_KEY sozlanmagan). ` +
        `Hozircha mavjud raqamlar: bugun ${context.bugungi_leadlar} ta lead, ` +
        `${context.bugungi_sotuvlar} ta sotuv, Telegramda ${context.telegram_foydalanuvchilar} foydalanuvchi bor.`,
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 700,
        system:
          "Siz — biznes uchun ichki nazorat markazi (JARVIS) AI-assistentisiz. " +
          "Foydalanuvchiga quyidagi joriy biznes ma'lumotlari asosida o'zbek tilida, aniq va qisqa javob bering.\n\n" +
          "JORIY MA'LUMOTLAR:\n" + JSON.stringify(context, null, 2),
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "AI xizmatidan xatolik" }, { status: 500 });
    }
    const text = data.content?.map((c) => c.text || "").join("\n") || "Javob topilmadi.";
    return NextResponse.json({ reply: text });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
