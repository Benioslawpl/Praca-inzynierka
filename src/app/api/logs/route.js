import pool from "../../../../db";
import { getUserFromCookie } from "../../../lib/auth";

export async function GET(req) {
  try {
    const u = getUserFromCookie();
    if (!u.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

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

    const { rows } = await pool.query(
      `SELECT
         at        AS "date",
         username  AS "username",
         action    AS "action",
         entity    AS "entity",
         entity_id AS "entityId",
         changes   AS "changes",
         ip        AS "ip"
       FROM audit_logs
       ${WHERE}
       ORDER BY at DESC
       LIMIT $${vals.length}`, vals
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}