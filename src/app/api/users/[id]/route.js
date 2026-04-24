import bcrypt from "bcryptjs";

import pool from "../../../../../db";
import { getUserFromRequest } from "../../../../lib/auth";
import { audit } from "../../../../lib/audit";

function getIdFrom(req, ctx) {
  const fromParams = ctx?.params?.id;
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

async function getUserRow(id) {
  const { rows } = await pool.query(
    `SELECT id, username, role, created_at, blocked
     FROM users
     WHERE id=$1`,
    [id]
  );

  return rows[0] || null;
}

export async function PUT(req, ctx) {
  try {
    const me = getUserFromRequest(req);
    if (!me?.isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = getIdFrom(req, ctx);
    if (!parsed.ok) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.reset_password) {
      const newPass = String(body?.new_password || "").trim();
      if (newPass.length < 3) {
        return Response.json(
          { error: "Podaj poprawne nowe hasło" },
          { status: 400 }
        );
      }

      const before = await getUserRow(parsed.id);
      const hash = await bcrypt.hash(newPass, 10);

      await pool.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [
        hash,
        parsed.id,
      ]);

      if (before) {
        await audit({
          action: "update",
          entity: "users",
          entityId: parsed.id,
          before,
          after: { ...before, password_reset: true },
          req,
        });
      }

      return Response.json({ ok: true });
    }

    if (typeof body?.blocked === "boolean") {
      const before = await getUserRow(parsed.id);
      const { rows } = await pool.query(
        `UPDATE users
         SET blocked=$1
         WHERE id=$2
         RETURNING id, username, role, created_at, blocked`,
        [body.blocked, parsed.id]
      );

      if (!rows[0]) {
        return Response.json(
          { error: "Nie znaleziono użytkownika" },
          { status: 404 }
        );
      }

      await audit({
        action: "update",
        entity: "users",
        entityId: parsed.id,
        before,
        after: rows[0],
        req,
      });

      return Response.json(rows[0]);
    }

    if (typeof body?.role === "string") {
      const before = await getUserRow(parsed.id);
      const role = body.role === "admin" ? "admin" : "user";

      const { rows } = await pool.query(
        `UPDATE users
         SET role=$1
         WHERE id=$2
         RETURNING id, username, role, created_at, blocked`,
        [role, parsed.id]
      );

      if (!rows[0]) {
        return Response.json(
          { error: "Nie znaleziono użytkownika" },
          { status: 404 }
        );
      }

      await audit({
        action: "update",
        entity: "users",
        entityId: parsed.id,
        before,
        after: rows[0],
        req,
      });

      return Response.json(rows[0]);
    }

    return Response.json(
      { error: "Brak danych do aktualizacji" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, ctx) {
  try {
    const me = getUserFromRequest(req);
    if (!me?.isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = getIdFrom(req, ctx);
    if (!parsed.ok) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    if (me?.id === parsed.id) {
      return Response.json(
        { error: "Nie możesz usunąć samego siebie" },
        { status: 400 }
      );
    }

    const before = await getUserRow(parsed.id);
    const { rowCount } = await pool.query(`DELETE FROM users WHERE id=$1`, [
      parsed.id,
    ]);

    if (!rowCount) {
      return Response.json(
        { error: "Nie znaleziono użytkownika" },
        { status: 404 }
      );
    }

    if (before) {
      await audit({
        action: "delete",
        entity: "users",
        entityId: parsed.id,
        before,
        req,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
