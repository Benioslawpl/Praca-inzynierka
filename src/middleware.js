export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import pool from "../db";
import { getJwtSecret } from "./lib/env";

const SECRET = getJwtSecret();
const OPERATIONAL_API_PREFIXES = [
  "/api/budowy",
  "/api/brygady",
  "/api/sprzet",
];
const OPERATIONAL_ROLES = new Set([
  "admin",
  "brygadzista",
  "kierownik",
  "biuro",
]);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isAuthApi = pathname.startsWith("/api/auth");
  const isLoginPage = pathname === "/login";
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public");
  const isOperationalApi = OPERATIONAL_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAuthApi || isLoginPage || isPublicAsset) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payload = jwt.verify(token, SECRET);
    const userId = Number(payload?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("INVALID_USER");
    }

    const { rows } = await pool.query(
      `SELECT blocked, role
       FROM users
       WHERE id=$1`,
      [userId]
    );

    if (!rows[0] || rows[0].blocked) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.set("token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    if (isOperationalApi && !OPERATIONAL_ROLES.has(rows[0].role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: ["/:path*"],
};
