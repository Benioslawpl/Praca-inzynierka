import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

/* ===== SERVER COMPONENTS (layout.js, server pages) ===== */
export async function getUserFromCookies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const p = verifyJwt(token);
    return {
      id: p.id,
      username: p.username,
      role: p.role,
      isAdmin: p.role === "admin",
    };
  } catch {
    return null;
  }
}

/* ===== API ROUTES (route.js) ===== */
export function getUserFromRequest(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) return null;

    const p = verifyJwt(token);
    return {
      id: p.id,
      username: p.username,
      role: p.role,
      isAdmin: p.role === "admin",
    };
  } catch {
    return null;
  }
}
