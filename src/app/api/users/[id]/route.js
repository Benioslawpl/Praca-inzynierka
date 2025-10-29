import pool from "../../../../../db";
import { cookies } from "next/headers";
import { getUserFromCookies, requireAdmin } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req, { params }) {
  try {
    const admin = getUserFromCookies(cookies());
    requireAdmin(admin);

    const { id } = params;
    const { is_active, reset_password, new_password, role, email } = await req.json();

    const fields = [];
    const values = [];
    let i = 1;

    if (typeof is_active === "boolean") { fields.push(`is_active=$${i++}`); values.push(is_active); }
    if (role) { fields.push(`role=$${i++}`); values.push(role); }
    if (email !== undefined) { fields.push(`email=$${i++}`); values.push(email); }

    if (reset_password === true) {
      if (!new_password) return Response.json({ error: "Brak new_password" }, { status: 400 });
      const hash = await bcrypt.hash(new_password, 10);
      fields.push(`password_hash=$${i++}`, `password_changed_at=NOW()`);
      values.push(hash);
    }

    if (!fields.length) return Response.json({ error: "Brak zmian" }, { status: 400 });

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id=$${i}
       RETURNING id, username, email, role, is_active, created_at, last_login`,
      values
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

    // (opcjonalnie) LOG:
    // await pool.query(`INSERT INTO logs (user_id, action, target_table, target_id, details) VALUES ($1,$2,$3,$4,$5)`,
    //   [admin.id, "user.update", "users", rows[0].id, rows[0]]);

    return Response.json(rows[0]);
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
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });

    // (opcjonalnie) LOG:
    // await pool.query(`INSERT INTO logs (user_id, action, target_table, target_id) VALUES ($1,$2,$3,$4)`,
    //   [admin.id, "user.delete", "users", id]);

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}