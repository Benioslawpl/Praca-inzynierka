import pool from "../../../../db";
import bcrypt from "bcryptjs";
import { getUserFromCookies } from "../../../lib/auth";

// GET /api/users  (tylko admin)
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

// POST /api/users  (tylko admin)
export async function POST(req) {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { username, password, role } = await req.json();

    if (!username || !password) {
      return Response.json({ error: "Wymagane: username, password" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const r = role === "admin" ? "admin" : "user";

    const { rows } = await pool.query(
      `
      INSERT INTO users (username, password_hash, role, blocked)
      VALUES ($1, $2, $3, false)
      RETURNING id, username, role, created_at, blocked
      `,
      [username, hash, r]
    );

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}