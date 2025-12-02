// src/lib/auth.js

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const JWT_SECRET = process.env.JWT_SECRET || "Test123!";

//
// 1) Generowanie tokena
//
export function signJwt(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "8h",
    ...options,
  });
}

//
// 2) Weryfikacja JWT — bez wywalania błędu
//
export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

//
// 3) Pobieranie użytkownika BEZ wywalania błędów RSC
//
export function getUserFromCookies() {
  try {
    const cookie = cookies().get("token");
    if (!cookie?.value) return null;

    const payload = verifyJwt(cookie.value);
    if (!payload) return null;

    const role = payload.role || (payload.username === "admin" ? "admin" : "user");

    return {
      id: payload.id ?? null,
      username: payload.username ?? null,
      role,
      isAdmin: role === "admin",
    };
  } catch (err) {
    console.error("getUserFromCookies() error:", err);
    return null;
  }
}

//
// 4) Guard dla API tylko dla administratorów
//
export function requireAdmin() {
  const user = getUserFromCookies();

  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return user; // zwracamy usera jeśli OK
}
