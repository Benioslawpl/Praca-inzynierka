import pool from "../../../../../db";
import { cookies } from "next/headers";
import { getUserFromCookie, requireAdmin } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req, { params }) {
  try {
    const admin = getUserFromCookies(cookies());
    requireAdmin(admin);

    const { id } = params;
    const { reset_password, new_password, role } = await req.json();

    if (reset_password && new_password) {
      const hash = await bcrypt.hash(new_password, 10);
      const { rows } = await pool.query(
        `UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id, username, role, created_at`,
        [hash, id]
      );
      return Response.json(rows[0]);
    }

    if (role) {
      const { rows } = await pool.query(
        `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, username, role, created_at`,
        [role, id]
      );
      return Response.json(rows[0]);
    }

    return Response.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = getUserFromCookies(cookies());
    requireAdmin(admin);

    const { id } = params;
    const { rowCount } = await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}