import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

// ================= JWT =================

export function signJwt(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h", ...opts });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function getUserFromRequest(req) {
  try {
    const cookieHeader = req?.headers?.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .map(s => s.trim())
      .find(s => s.startsWith("token="))
      ?.split("=")[1];

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

// ================= API ROUTES =================
// (route.js – req.headers)

export function getUserFromRequest(req) {
  try {
    const cookieHeader = req?.headers?.get("cookie") || "";

    const token = cookieHeader
      .split(";")
      .map(v => v.trim())
      .find(v => v.startsWith("token="))
      ?.slice(6);

    if (!token) return null;

    const p = verifyJwt(decodeURIComponent(token));
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