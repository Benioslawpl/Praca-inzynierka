import pool from "../../../../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "super_tajne_haslo";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const { rows } = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username=$1",
      [username]
    );
    if (!rows.length) {
      return Response.json({ error: "Błędny login lub hasło" }, { status: 401 });
    }
    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json({ error: "Błędny login lub hasło" }, { status: 401 });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "8h" });

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        // HttpOnly = niewidoczny dla JS, Path=/ = dla całej aplikacji
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${8 * 60 * 60}; SameSite=Lax`,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}