import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signJwt } from "../../../../lib/auth";  // 🔥 poprawiona ścieżka

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: "Brak loginu lub hasła" }, { status: 400 });
    }

    // 🔹 Pobieramy użytkownika z bazy
    const rows = await query(
      "SELECT id, username, password_hash, role FROM users WHERE username = $1",
      [username]
    );

    const user = rows[0];
    if (!user) {
      return Response.json({ error: "Nieprawidłowy login" }, { status: 401 });
    }

    // 🔹 Weryfikacja hasła
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
    }

    // 🔹 Tworzymy JWT
    const role = user.role || "user";
    const token = signJwt({
      id: user.id,
      username: user.username,
      role,
    });

    // 🔹 Zapisujemy cookie
    cookies().set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    });

    return Response.json({ ok: true, username: user.username, role });

  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}