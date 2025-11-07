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
    if (!token)
      return { id: null, username: null, role: null, isAdmin: false };

    const p = verifyJwt(token);
    const role = p.role || (p.username === "admin" ? "admin" : "user");
    return {
      id: p.id ?? null,
      username: p.username ?? null,
      role,
      isAdmin: role === "admin",
    };
  } catch {
    return { id: null, username: null, role: null, isAdmin: false };
  }
}