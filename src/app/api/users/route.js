import pool from "../../../../db";
import { cookies } from "next/headers";
import { getUserFromCookies, requireAdmin } from "../../../lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const admin = getUserFromCookies(cookies());
    requireAdmin(admin);

    const { rows } = await pool.query(
      `SELECT id, username, role, created_at FROM users ORDER BY id ASC`
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req) {
  try {
    const admin = getUserFromCookies(cookies());
    requireAdmin(admin);

    const { username, password, role = "user" } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Wymagane: login i hasło" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1,$2,$3)
       RETURNING id, username, role, created_at`,
      [username, hash, role]
    );

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}