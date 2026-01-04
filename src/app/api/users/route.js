import pool from "../../../../db";
import bcrypt from "bcryptjs";
import { getUserFromCookies } from "../../../lib/auth";

export async function GET() {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { rows } = await pool.query(`
      SELECT id, username, role, created_at, blocked
      FROM users
      ORDER BY id ASC
    `);

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const role = body?.role === "admin" ? "admin" : "user";
    const blocked = !!body?.blocked;

    if (!username || !password) {
      return Response.json({ error: "Wymagane: username i password" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role, blocked)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, created_at, blocked`,
      [username, hash, role, blocked]
    );

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
