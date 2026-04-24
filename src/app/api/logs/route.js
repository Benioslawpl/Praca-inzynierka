import pool from "../../../../db";
import { verifyJwt } from "../../../lib/auth";

function toStr(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
}

function buildChanges({ action, before_row, after_row, changes }) {
  if (Array.isArray(changes) && changes.length) return changes;

  const before = before_row || {};
  const after = after_row || {};
  const out = [];

  if (action === "create") {
    for (const key of Object.keys(after)) {
      const to = normalizeValue(after[key]);
      if (to !== null) out.push({ field: key, from: null, to });
    }
    return out;
  }

  if (action === "delete") {
    for (const key of Object.keys(before)) {
      const from = normalizeValue(before[key]);
      if (from !== null) out.push({ field: key, from, to: null });
    }
    return out;
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const from = normalizeValue(before[key]);
    const to = normalizeValue(after[key]);
    if (toStr(from) !== toStr(to)) out.push({ field: key, from, to });
  }

  return out;
}

function buildObjectLabel(entity, entityId, beforeRow, afterRow) {
  const row = afterRow || beforeRow || {};

  if (entity === "maszyny") {
    return row.nr || `Maszyna #${entityId}`;
  }

  if (entity === "sprzet") {
    return row.nr || `Sprzęt #${entityId}`;
  }

  if (entity === "brygady") {
    return row.numer || `Brygada #${entityId}`;
  }

  if (entity === "members") {
    const label = [row.imie, row.nazwisko].filter(Boolean).join(" ");
    return label || `Członek #${entityId}`;
  }

  if (entity === "users") {
    return row.username || `Użytkownik #${entityId}`;
  }

  if (entity === "maszyny_details") {
    return row.maszyna_nr || row.nr || `Maszyna #${row.maszyna_id || entityId}`;
  }

  if (entity === "sprzet_details") {
    return row.sprzet_nr || row.nr || `Sprzęt #${row.sprzet_id || entityId}`;
  }

  if (entity === "auth") {
    return row.username ? `Sesja ${row.username}` : "Sesja użytkownika";
  }

  return entityId ? `${entity} #${entityId}` : entity || "-";
}

export async function GET(req) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token =
      cookie
        .split("; ")
        .find((item) => item.startsWith("token="))
        ?.split("=")[1] || null;

    if (!token) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let user = null;
    try {
      user = verifyJwt(token);
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const where = [];
    const values = [];

    if (entity) {
      values.push(entity);
      where.push(`entity = $${values.length}`);
    }

    if (action) {
      values.push(action);
      where.push(`action = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    values.push(limit);

    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(at, NOW()) AS "date",
        username            AS "username",
        action              AS "action",
        entity              AS "entity",
        entity_id           AS "entityId",
        changes             AS "changes",
        before_row          AS "before_row",
        after_row           AS "after_row",
        ip                  AS "ip"
      FROM audit_logs
      ${whereClause}
      ORDER BY COALESCE(at, NOW()) DESC, id DESC
      LIMIT $${values.length}
      `,
      values
    );

    const result = rows.map((row) => {
      const finalChanges = buildChanges({
        action: row.action,
        before_row: row.before_row,
        after_row: row.after_row,
        changes: row.changes,
      });

      const trimmed = finalChanges.map((change) => {
        const MAX = 200;
        const trimLong = (value) => {
          const str = toStr(value);
          return str.length > MAX ? str.slice(0, MAX) + "…" : value;
        };

        return {
          field: change.field,
          from: trimLong(change.from),
          to: trimLong(change.to),
        };
      });

      return {
        date: row.date,
        username: row.username || "-",
        action: row.action || "-",
        entity: row.entity || "-",
        entityId: row.entityId,
        objectLabel: buildObjectLabel(
          row.entity,
          row.entityId,
          row.before_row,
          row.after_row
        ),
        changes: trimmed,
        ip: row.ip || "-",
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error("API /logs error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
