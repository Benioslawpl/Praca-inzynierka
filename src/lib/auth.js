import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "Test123!";

// ✅ uniwersalna funkcja – zgodna z Twoimi importami
export function getUserFromCookies() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, SECRET);
    return decoded; // { id, username, role, ... }
  } catch {
    return null;
  }
}

// 🔐 opcjonalny strażnik dostępu dla administratora
export function requireAdmin() {
  const user = getUserFromCookies();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}