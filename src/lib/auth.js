import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

export function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h", ...opts });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function getUserFromCookies() {
  try {
    const cookieStore = await cookies(); // ✅
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const p = verifyJwt(token);
    const role = p.role || (p.username === "admin" ? "admin" : "user");

    return {
      id: p.id ?? null,
      username: p.username ?? null,
      role,
      isAdmin: role === "admin",
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getUserFromCookies();
  if (!user?.isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
