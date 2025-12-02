import pool from "../../../../db";
import { verifyJwt } from "../../../lib/auth";

function toStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

// Wyliczanie zmian jeśli brakuje `changes`
function buildChanges({ action, before_row, after_row, changes }) {
  if (Array.isArray(changes) && changes.length) return changes;

  const before = before_row || {};
  const after  = after_row  || {};
  const out    = [];

  if (action === "create") {
    for (const k of Object.keys(after)) {
      out.push({ field: k, from: undefined, to: after[k] });
    }
    return out;
  }

  if (action === "delete") {
    for (const k of Object.keys(before)) {
      out.push({ field: k, from: before[k], to: undefined });
    }
    return out;
  }

  // update
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const a = toStr(before[k]);
    const b = toStr(after[k]);
    if (a !== b) out.push({ field: k, from: before[k], to: after[k] });
  }
  return out;
}

export async function GET(req) {
  try {
    // 🔥 Pobranie ciasteczka ręcznie — DZIAŁA ZAWSZE W ROUTE HANDLERACH
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split("; ")
      .find((x) => x.startsWith("token="))
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

    // 🔍 Filtry
    const { searchParams } = new URL(req.url);
    const limit  = Math.min(Number(searchParams.get("limit") || 200), 500);
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const where = [];
    const vals = [];

    if (entity) { vals.push(entity); where.push(`entity = $${vals.length}`); }
    if (action) { vals.push(action); where.push(`action = $${vals.length}`); }

    const WHERE = where.length ? `WHERE ${where.join(" AND ")}` : "";
    vals.push(limit);

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
      ${WHERE}
      ORDER BY COALESCE(at, NOW()) DESC, id DESC
      LIMIT $${vals.length}
      `,
      vals
    );

    // 🔧 Budowanie finalnych zmian
    const result = rows.map((r) => {
      const finalChanges = buildChanges({
        action: r.action,
        before_row: r.before_row,
        after_row: r.after_row,
        changes: r.changes,
      });

      // Przycięcie bardzo długich wartości
      const trimmed = finalChanges.map(c => {
        const MAX = 200;
        const norm = (v) => {
          const s = toStr(v);
          return s.length > MAX ? s.slice(0, MAX) + "…" : v;
        };
        return { field: c.field, from: norm(c.from), to: norm(c.to) };
      });

      return {
        date: r.date,
        username: r.username || "-",
        action: r.action || "-",
        entity: r.entity || "-",
        entityId: r.entityId,
        changes: trimmed,
        ip: r.ip || "-",
      };
    });

    return Response.json(result);

  } catch (e) {
    console.error("API /logs error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
