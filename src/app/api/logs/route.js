import pool from "../../../../db";
import { getUserFromCookies } from "../../../lib/auth";

function toStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

// policz zmiany, jeśli brak `changes`
function buildChanges({ action, before_row, after_row, changes }) {
  if (Array.isArray(changes) && changes.length) return changes;

  const before = before_row || {};
  const after  = after_row  || {};
  const diffs  = [];

  if (action === "create") {
    for (const k of Object.keys(after)) {
      diffs.push({ field: k, from: undefined, to: after[k] });
    }
    return diffs;
  }

  if (action === "delete") {
    for (const k of Object.keys(before)) {
      diffs.push({ field: k, from: before[k], to: undefined });
    }
    return diffs;
  }

  // update – porównaj różne pola
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const a = toStr(before[k]);
    const b = toStr(after[k]);
    if (a !== b) diffs.push({ field: k, from: before[k], to: after[k] });
  }
  return diffs;
}

export async function GET(req) {
  try {
    const u = getUserFromCookies();
    if (!u?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit  = Math.min(Number(searchParams.get("limit") || 200), 500);
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const where = [];
    const vals  = [];
    if (entity) { vals.push(entity); where.push(`entity = $${vals.length}`); }
    if (action) { vals.push(action); where.push(`action = $${vals.length}`); }
    const WHERE = where.length ? `WHERE ${where.join(" AND ")}` : "";

    vals.push(limit);

    // pobierz takze before_row/after_row, żeby móc policzyć różnice
    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(at, now()) AS "date",
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
      ORDER BY COALESCE(at, now()) DESC, id DESC
      LIMIT $${vals.length}
      `,
      vals
    );

    // zbuduj finalne `changes`
    const out = rows.map(r => {
      const finalChanges = buildChanges({
        action: r.action,
        before_row: r.before_row,
        after_row:  r.after_row,
        changes:    r.changes,
      });

      // obetnij bardzo długie wartości (czytelność)
      const trimmed = finalChanges.map(c => {
        const MAX = 200;
        const norm = v => {
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
        entityId: r.entityId || null,
        changes: trimmed,
        ip: r.ip || "-",
      };
    });

    return Response.json(out);
  } catch (e) {
    console.error("API /logs error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}