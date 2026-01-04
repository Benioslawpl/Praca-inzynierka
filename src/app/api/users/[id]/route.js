import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "../../../../lib/auth";

function badId() {
  return Response.json({ error: "bad id" }, { status: 400 });
}

export async function PUT(req, { params }) {
  const u = getUserFromRequest(req);
  if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params?.id);
  if (!Number.isFinite(id)) return badId();

  const body = await req.json().catch(() => ({}));

  // reset hasła
  if (body.reset_password) {
    const newPass = String(body.new_password || "");
    if (newPass.length < 3) return Response.json({ error: "Hasło za krótkie" }, { status: 400 });

    const hash = await bcrypt.hash(newPass, 10);
    await pool.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, id]);
    return Response.json({ ok: true });
  }

  // blokada / odblokowanie
  if (typeof body.blocked === "boolean") {
    const { rows } = await pool.query(
      `UPDATE users SET blocked=$1 WHERE id=$2 RETURNING id, username, role, created_at, blocked`,
      [body.blocked, id]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  }

  return Response.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
}

export async function DELETE(req, { params }) {
  const u = getUserFromRequest(req);
  if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params?.id);
  if (!Number.isFinite(id)) return badId();

  const r = await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
  if (!r.rowCount) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ok: true });
}
