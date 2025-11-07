import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

export function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h", ...opts });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserFromCookies() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    const p = verifyJwt(token);
    // upewniamy się, że rola jest stringiem
    const role = p.role || (p.username === "admin" ? "admin" : "user");
    return { id: p.id ?? null, username: p.username ?? null, role };
  } catch {
    return null;
  }
}

export function requireAdmin() {
  const user = getUserFromCookies();
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}