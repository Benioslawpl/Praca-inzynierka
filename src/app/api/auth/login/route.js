import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { signJwt } from "../../../../lib/auth";

function cookieHeader(name, value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${value}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

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
    if (!user) {
      return Response.json({ error: "Nieprawidłowy login" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
    }

    const role = user.role || (user.username === "admin" ? "admin" : "user");
    const token = signJwt({ id: user.id, username: user.username, role });

    // 8h
    const maxAge = 60 * 60 * 8;

    return new Response(JSON.stringify({ ok: true, username: user.username, role }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader("token", token, maxAge),
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
