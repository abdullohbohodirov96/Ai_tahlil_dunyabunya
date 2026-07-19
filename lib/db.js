import { Pool } from "pg";

let pool;

// Serverless muhitda (Vercel) funksiya har chaqiriqda qayta ishga tushishi
// mumkin, shuning uchun pool'ni global miqyosda bir marta yaratamiz.
export function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL sozlanmagan. .env.local yoki Vercel Environment Variables'da kiriting.");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = db();
  return client.query(text, params);
}
