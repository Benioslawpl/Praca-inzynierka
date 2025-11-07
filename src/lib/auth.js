import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

export function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h", ...opts });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserFromCookie() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    const p = verifyJwt(token);
    return {
      id: p.id ?? null,
      username: p.username ?? null,
      role: p.role ?? (p.username === "admin" ? "admin" : "user"),
    };
  } catch {
    return null;
  }
}

/**
 * Helper middleware do endpointów tylko dla admina
 * Zwraca Response 403 jeśli brak dostępu
 */
export function requireAdmin() {
  const user = getUserFromCookie();
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user; // zwracamy dane usera jeśli admin
}