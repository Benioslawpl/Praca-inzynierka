import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { signJwt } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const { rows } = await pool.query(
      "SELECT id, username, password_hash, role FROM users WHERE username=$1",
      [username]
    );

    const user = rows[0];
    if (!user) {
      return Response.json({ error: "Zły login" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json({ error: "Złe hasło" }, { status: 401 });
    }

    const token = signJwt({
      id: user.id,
      username: user.username,
      role: user.role, // ← TYLKO z DB
    });

    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

    return new Response(
      JSON.stringify({ ok: true, role: user.role }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax${secure}`,
        },
      }
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
