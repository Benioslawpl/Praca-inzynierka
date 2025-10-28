import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!"; // dodaj w .env.local

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Dozwolone bez logowania:
  const isAuthApi = pathname.startsWith("/api/auth");            // /api/auth/login, /api/auth/logout
  const isLoginPage = pathname === "/login";                     // strona logowania
  const isPublicAsset =
    pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/public");

  if (isAuthApi || isLoginPage || isPublicAsset) {
    return NextResponse.next();
  }

  // Sprawdź token w cookie
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    jwt.verify(token, SECRET); // OK → przepuść
    return NextResponse.next();
  } catch {
    // token nieprawidłowy / wygasł → na login
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Dopasuj WSZYSTKO poza assetami – middleware i tak filtruje login/ auth powyżej
export const config = {
  matcher: ["/:path*"],
};