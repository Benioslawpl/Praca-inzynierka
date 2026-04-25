import bcrypt from "bcryptjs";

import pool from "../../../../../db";
import { getUserFromRequest } from "../../../../lib/auth";
import { audit } from "../../../../lib/audit";
import { normalizeRole } from "../../../../lib/roles";

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
    `SELECT u.id, u.username, u.role, u.created_at, u.blocked,
            um.maszyna_id as assigned_machine_id,
            m.nr as assigned_machine_nr
     FROM users u
     LEFT JOIN user_maszyny um ON um.user_id = u.id
     LEFT JOIN maszyny m ON m.id = um.maszyna_id
     WHERE u.id=$1`,
    [id]
  );

  return rows[0] || null;
}

export async function PUT(req, ctx) {
  try {
    const me = await getUserFromRequest(req);
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

    if (
      typeof body?.username === "string" ||
      typeof body?.role === "string" ||
      Object.prototype.hasOwnProperty.call(body || {}, "assigned_machine_id")
    ) {
      const before = await getUserRow(parsed.id);
      const role = normalizeRole(body.role || before?.role);
      const username = String(body.username || before?.username || "").trim();
      const assignedMachineId = Number(body?.assigned_machine_id) || null;

      if (!username) {
        return Response.json({ error: "Wymagany login" }, { status: 400 });
      }

      const { rows } = await pool.query(
        `UPDATE users
         SET username=$1, role=$2
         WHERE id=$3
         RETURNING id, username, role, created_at, blocked`,
        [username, role, parsed.id]
      );

      if (!rows[0]) {
        return Response.json(
          { error: "Nie znaleziono użytkownika" },
          { status: 404 }
        );
      }

      await pool.query(`DELETE FROM user_maszyny WHERE user_id=$1`, [parsed.id]);

      if (assignedMachineId) {
        await pool.query(
          `INSERT INTO user_maszyny (user_id, maszyna_id)
           VALUES ($1,$2)`,
          [parsed.id, assignedMachineId]
        );
      }

      const after = await getUserRow(parsed.id);

      await audit({
        action: "update",
        entity: "users",
        entityId: parsed.id,
        before,
        after: after || rows[0],
        req,
      });

      return Response.json(after || rows[0]);
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
    const me = await getUserFromRequest(req);
    if (!me?.isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = getIdFrom(req, ctx);
    if (!parsed.ok) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    if (me.id === parsed.id) {
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
