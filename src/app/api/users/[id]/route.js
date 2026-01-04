import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { getUserFromCookies } from "../../../../lib/auth";

function badId() {
  return Response.json({ error: "bad id" }, { status: 400 });
}

export async function PUT(req, { params }) {
  try {
    // ✅ admin only
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const id = Number(params?.id);
    if (!Number.isFinite(id)) return badId();

    const body = await req.json().catch(() => ({}));

    // 1) reset hasła
    if (body?.reset_password) {
      const newPass = String(body?.new_password || "");
      if (newPass.length < 3) {
        return Response.json({ error: "Hasło za krótkie" }, { status: 400 });
      }
      const hash = await bcrypt.hash(newPass, 10);

      const { rows } = await pool.query(
        `UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id, username`,
        [hash, id]
      );
      if (!rows[0]) return Response.json({ error: "Nie znaleziono usera" }, { status: 404 });
      return Response.json({ ok: true });
    }

    // 2) blokada / odblokowanie
    if (typeof body?.blocked === "boolean") {
      const { rows } = await pool.query(
        `UPDATE users SET blocked=$1 WHERE id=$2 RETURNING id, username, blocked`,
        [body.blocked, id]
      );
      if (!rows[0]) return Response.json({ error: "Nie znaleziono usera" }, { status: 404 });
      return Response.json(rows[0]);
    }

    return Response.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const id = Number(params?.id);
    if (!Number.isFinite(id)) return badId();

    const { rowCount } = await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Nie znaleziono usera" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
