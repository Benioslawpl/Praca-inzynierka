import pool from "../../../../db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "super_tajne_haslo";

export async function GET(req) {
  try {
    // autoryzacja (tylko admin)
    const token = cookies().get("token")?.value || "";
    let isAdmin = false;
    try {
      const p = jwt.verify(token, SECRET);
      isAdmin = p.role === "admin" || p.username === "admin";
    } catch {}
    if (!isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // filtry
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

    // aliasy => to co frontend ma czytać
    const { rows } = await pool.query(
      `SELECT
         at                 AS "date",
         username           AS "username",
         action             AS "action",
         entity             AS "entity",
         entity_id          AS "entityId",
         changes            AS "changes",
         ip                 AS "ip"
       FROM audit_logs
       ${WHERE}
       ORDER BY at DESC
       LIMIT $${vals.length}`,
      vals
    );

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}