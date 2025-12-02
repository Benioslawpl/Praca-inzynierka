import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signJwt } from "../../../../../lib/auth";  // 🔥 poprawiona ścieżka

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json(
        { error: "Brak loginu lub hasła" },
        { status: 400 }
      );
    }

    // 🔹 Pobranie użytkownika
    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role FROM users WHERE username=$1`,
      [username]
    );

    const user = rows[0];
    if (!user) {
      return Response.json(
        { error: "Nieprawidłowy login" },
        { status: 401 }
      );
    }

    // 🔹 Weryfikacja hasła
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json(
        { error: "Nieprawidłowe hasło" },
        { status: 401 }
      );
    }

    // 🔹 Rola
    const role = user.role || (user.username === "admin" ? "admin" : "user");

    // 🔹 Tworzenie tokenu
    const token = signJwt({
      id: user.id,
      username: user.username,
      role,
    });

    // 🔹 Zapis cookies
    cookies().set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 godzin
    });

    return Response.json({
      ok: true,
      username: user.username,
      role,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return Response.json(
      { error: "Błąd serwera: " + err.message },
      { status: 500 }
    );
  }
}
