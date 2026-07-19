// Ishga tushirish: npm run db:init
// (avval .env.local yoki muhitda DATABASE_URL sozlangan bo'lishi kerak)
import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','marketing_head','sales_manager','smm','viewer')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  sheet_row_id TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'yangi' CHECK (status IN ('yangi','bogliq','bogliq_emas','sifatli','rad')),
  note TEXT,
  manager_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_daily (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER REFERENCES users(id),
  day DATE NOT NULL,
  leads_count INTEGER NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (manager_id, day)
);

CREATE TABLE IF NOT EXISTS target_stats (
  id SERIAL PRIMARY KEY,
  day DATE NOT NULL,
  campaign_name TEXT,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  source TEXT DEFAULT 'meta'
);

CREATE TABLE IF NOT EXISTS smm_stats (
  id SERIAL PRIMARY KEY,
  day DATE NOT NULL,
  platform TEXT,
  followers INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tg_users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  started_bot BOOLEAN DEFAULT false,
  joined_group BOOLEAN DEFAULT false,
  group_title TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tg_tasks (
  id SERIAL PRIMARY KEY,
  tg_user_id INTEGER REFERENCES tg_users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'yangi' CHECK (status IN ('yangi','jarayonda','bajarildi')),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_connections (
  id SERIAL PRIMARY KEY,
  service TEXT UNIQUE NOT NULL,
  label TEXT,
  connected BOOLEAN DEFAULT false,
  meta TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  UNIQUE (user_id, module)
);

-- Telegram akkauntini web foydalanuvchisiga bog'lash uchun (eski bazalarga ham qo'shiladi)
ALTER TABLE tg_users ADD COLUMN IF NOT EXISTS linked_user_id INTEGER REFERENCES users(id);

-- Barcha tashqi xizmat ulanishlarini (Sheets, Telegram, Meta, Instagram, AI) to'g'ridan-to'g'ri
-- webdan boshqarish uchun — Vercel Environment Variables'ga muhtoj bo'lmaslik uchun
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

-- To'liq CRM uchun qo'shimcha maydonlar (mavjud bazalarga ham qo'shiladi)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quality TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sale_amount NUMERIC;

-- Har bir lead bo'yicha tarix (izohlar, holat o'zgarishlari) — CRM'ning "activity log"i
CREATE TABLE IF NOT EXISTS lead_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'note',
  text TEXT,
  created_at TIMESTAMP DEFAULT now()
);
`;

async function main() {
  console.log("Sxema yaratilmoqda...");
  await pool.query(schema);

  const services = {
    telegram: "Telegram Bot",
    google_sheets: "Google Sheets",
    meta_ads: "Meta Ads (Target)",
    instagram: "Instagram (SMM)",
  };
  for (const [service, label] of Object.entries(services)) {
    await pool.query(
      `INSERT INTO api_connections (service, label) VALUES ($1, $2)
       ON CONFLICT (service) DO NOTHING`,
      [service, label]
    );
  }

  const adminExists = await pool.query("SELECT 1 FROM users WHERE username = 'admin'");
  if (adminExists.rows.length === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    await pool.query(
      "INSERT INTO users (full_name, username, password_hash, role) VALUES ($1, $2, $3, 'admin')",
      ["Bosh Admin", "admin", hash]
    );
    console.log("✅ Admin yaratildi -> login: admin / parol: admin123");
  } else {
    console.log("Admin allaqachon mavjud.");
  }

  console.log("✅ Baza tayyor.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
