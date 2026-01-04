import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "../../../../lib/auth";

// --- helper: wyciągnij id z params albo z URL
function getIdFrom(req, ctx) {
  // 1) preferuj params.id jeśli jest
  const fromParams = ctx?.params?.id;

  // 2) fallback: weź ostatni segment URL (/api/users/13 => 13)
  const pathname = new URL(req.url).pathname;
  const fromPath = pathname.split("/").filter(Boolean).pop();

  const raw = fromParams ?? fromPath;
  const id = Number(raw);

  return {
    raw,
    id,
    ok: Number.isInteger(id) && id > 0,
  };
}

// PUT /api/users/:id
export async function PUT(req, ctx) {
  try {
    const me = getUserFromRequest(req);
    if (!me?.isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = getIdFrom(req, ctx);
    if (!parsed.ok) {
      return Response.json(
        { error: "Bad id", debug: { raw: parsed.raw, pathname: new URL(req.url).pathname, params: ctx?.params || null } },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // 1) reset hasła
    if (body?.reset_password) {
      const newPass = String(body?.new_password || "").trim();
      if (newPass.length < 3) {
        return Response.json({ error: "Podaj poprawne nowe hasło" }, { status: 400 });
      }
      const hash = await bcrypt.hash(newPass, 10);

      await pool.query(
        `UPDATE users SET password_hash=$1 WHERE id=$2`,
        [hash, parsed.id]
      );

      return Response.json({ ok: true });
    }

    // 2) blokada/odblokowanie
    if (typeof body?.blocked === "boolean") {
      const { rows } = await pool.query(
        `UPDATE users
         SET blocked=$1
         WHERE id=$2
         RETURNING id, username, role, created_at, blocked`,
        [body.blocked, parsed.id]
      );

      if (!rows[0]) return Response.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
      return Response.json(rows[0]);
    }

    // 3) zmiana roli (opcjonalnie)
    if (typeof body?.role === "string") {
      const role = body.role === "admin" ? "admin" : "user";
      const { rows } = await pool.query(
        `UPDATE users
         SET role=$1
         WHERE id=$2
         RETURNING id, username, role, created_at, blocked`,
        [role, parsed.id]
      );
      if (!rows[0]) return Response.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
      return Response.json(rows[0]);
    }

    return Response.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
  } catch (e) {
    console.error("PUT /api/users/[id] error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/users/:id
export async function DELETE(req, ctx) {
  try {
    const me = getUserFromRequest(req);
    if (!me?.isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = getIdFrom(req, ctx);
    if (!parsed.ok) {
      return Response.json(
        { error: "Bad id", debug: { raw: parsed.raw, pathname: new URL(req.url).pathname, params: ctx?.params || null } },
        { status: 400 }
      );
    }

    // zabezpieczenie: nie usuwaj siebie (opcjonalnie)
    if (me?.id === parsed.id) {
      return Response.json({ error: "Nie możesz usunąć samego siebie" }, { status: 400 });
    }

    const { rowCount } = await pool.query(`DELETE FROM users WHERE id=$1`, [parsed.id]);
    if (!rowCount) return Response.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/users/[id] error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
