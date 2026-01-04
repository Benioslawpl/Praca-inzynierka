import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { requireAdminFromRequest } from "../../../../lib/auth";

export async function PUT(req, { params }) {
  try {
    const guard = requireAdminFromRequest(req);
    if (!guard.ok) return guard.res;

    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const body = await req.json();

    // reset hasła
    if (body?.reset_password && body?.new_password) {
      const hash = await bcrypt.hash(body.new_password, 10);
      const { rows } = await pool.query(
        `UPDATE users SET password_hash=$1 WHERE id=$2
         RETURNING id, username, role, created_at, blocked`,
        [hash, id]
      );
      return Response.json(rows[0] || null);
    }

    // blokada / odblokowanie
    if (typeof body?.blocked === "boolean") {
      const { rows } = await pool.query(
        `UPDATE users SET blocked=$1 WHERE id=$2
         RETURNING id, username, role, created_at, blocked`,
        [body.blocked, id]
      );
      return Response.json(rows[0] || null);
    }

    return Response.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = requireAdminFromRequest(req);
    if (!guard.ok) return guard.res;

    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
