import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { audit } from "../../../../lib/audit";

const SECRET = process.env.JWT_SECRET || "Test123!";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Brak loginu lub hasła" }, { status: 400 });
    }

    // pobierz użytkownika
    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = rows[0];
    if (!user) {
      return Response.json({ error: "Nieprawidłowy login" }, { status: 401 });
    }

    // sprawdź hasło
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
    }

    // rola: z kolumny "role" (lub fallback)
    const role =
      user.role && typeof user.role === "string"
        ? user.role
        : user.username === "admin"
        ? "admin"
        : "user";

    // podpisz JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role },
      SECRET,
      { expiresIn: "8h" }
    );

    // ustaw ciasteczko (1 miejsce, bez duplikatów nagłówków)
    cookies().set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    });

    // (opcjonalnie) wpisz do logów audytu
    // try {
    //   await audit({ action: "login", entity: "auth", after: { username: user.username }, req });
    // } catch {}

    return Response.json({ ok: true, username: user.username, role });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}