import pool from "../../../../db";
import { cookies } from "next/headers";
import { getUserFromCookies, requireAdmin } from "../../../lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const admin = getUserFromCookies(cookies());
    requireAdmin(admin);

    const { rows } = await pool.query(
      `SELECT id, username, email, role, is_active, created_at, last_login
       FROM users
       ORDER BY id ASC`
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

    const { username, password, email = null, role = "user", is_active = true } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Wymagane: username i password" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, username, email, role, is_active, created_at`,
      [username, email, hash, role, is_active]
    );

    // (opcjonalnie) LOG: kto dodał użytkownika
    // await pool.query(`INSERT INTO logs (user_id, action, target_table, target_id, details) VALUES ($1,$2,$3,$4,$5)`,
    //   [admin.id, "user.create", "users", rows[0].id, rows[0]]);

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}