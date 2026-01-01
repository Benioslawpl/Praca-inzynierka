import pool from "../../../../db";
import { cookies } from "next/headers";
import { getUserFromCookies, requireAdmin } from "../../../lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { rows } = await pool.query(`
      SELECT id, username, role, created_at, is_active
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

    const { username, password, role = "user" } = await req.json();

    if (!username || !password) {
      return Response.json({ error: "Wymagane: username i password" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, username, role, created_at, is_active`,
      [username, password_hash, role]
    );

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}