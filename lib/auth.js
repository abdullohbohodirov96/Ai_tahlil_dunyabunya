import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Requestdan foydalanuvchini o'qiydi, bo'lmasa null qaytaradi
export function getUser(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// API route ichida chaqiriladi: ruxsat bo'lmasa Response qaytaradi, bo'lsa null
export function requireAuth(req, ...roles) {
  const user = getUser(req);
  if (!user) {
    return { error: NextResponse.json({ error: "Token topilmadi yoki yaroqsiz" }, { status: 401 }) };
  }
  if (roles.length && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Bu amal uchun ruxsat yo'q" }, { status: 403 }) };
  }
  return { user };
}
