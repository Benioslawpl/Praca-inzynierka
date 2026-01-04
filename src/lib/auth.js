import "server-only";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

// --- JWT ---
export function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h", ...opts });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

// --- Cookie parser z nagłówka (dla API route handlers) ---
function parseCookieHeader(cookieHeader = "") {
  const out = {};
  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(v.join("=") || "");
  });
  return out;
}

// ✅ DO API: czytaj token z req.headers (pewne na Vercel)
export function getUserFromRequest(req) {
  try {
    const cookieHeader = req?.headers?.get?.("cookie") || "";
    const c = parseCookieHeader(cookieHeader);
    const token = c.token;
    if (!token) return null;

    const p = verifyJwt(token);
    const role = p.role || (p.username === "admin" ? "admin" : "user");

    return { id: p.id ?? null, username: p.username ?? null, role, isAdmin: role === "admin" };
  } catch {
    return null;
  }
}

// ✅ DO SERVER COMPONENTS (layout/page): można dalej cookies()
export function getUserFromCookies() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;

    const p = verifyJwt(token);
    const role = p.role || (p.username === "admin" ? "admin" : "user");

    return { id: p.id ?? null, username: p.username ?? null, role, isAdmin: role === "admin" };
  } catch {
    return null;
  }
}

export function requireAdminFromRequest(req) {
  const u = getUserFromRequest(req);
  if (!u?.isAdmin) {
    return { ok: false, res: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user: u };
}