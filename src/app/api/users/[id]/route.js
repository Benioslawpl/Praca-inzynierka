import pool from "../../../../../db";
import { cookies } from "next/headers";
import { getUserFromCookies, requireAdmin } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req, { params }) {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    const body = await req.json();

    // 1) toggle aktywności (blokada)
    if (typeof body.is_active === "boolean") {
      const { rows } = await pool.query(
        `UPDATE users SET is_active=$1 WHERE id=$2
         RETURNING id, username, role, created_at, is_active`,
        [body.is_active, id]
      );
      if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(rows[0]);
    }

    // 2) reset hasła
    if (body.reset_password === true) {
      const newPass = String(body.new_password || "");
      if (newPass.length < 3) {
        return Response.json({ error: "Hasło za krótkie" }, { status: 400 });
      }
      const hash = await bcrypt.hash(newPass, 10);
      await pool.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, id]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Brak obsługiwanej akcji" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const id = Number(params.id);
    if (!Number.isFinite(id)) return Response.json({ error: "Bad id" }, { status: 400 });

    // nie pozwól usunąć samego siebie (opcjonalnie, ale polecam)
    if (u.id === id) return Response.json({ error: "Nie możesz usunąć siebie" }, { status: 400 });

    const r = await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
    if (!r.rowCount) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}