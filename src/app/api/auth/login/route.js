import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers"; // ← wymagany import


const SECRET = process.env.JWT_SECRET || "Test123!";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Brak loginu lub hasła" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "SELECT id, username, password_hash, role FROM users WHERE username=$1",
      [username]
    );
    const user = rows[0];
    if (!user) return Response.json({ error: "Nieprawidłowy login" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return Response.json({ error: "Nieprawidłowe hasło" }, { status: 401 });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: "8h" }
    );

    const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; // https na Vercel
    return new Response(JSON.stringify({ ok: true, role: user.role }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie":
          `token=${token}; HttpOnly; Path=/; Max-Age=${8 * 60 * 60}; SameSite=Lax${secure}`,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}