import pool from "../../../../../db";
import { getUserFromRequest } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user?.isAdmin && !user?.canViewOperations) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pool.query(
    `
    SELECT u.id, u.username
    FROM users u
    WHERE u.role = 'kierownik' AND COALESCE(u.blocked, false) = false
    ORDER BY u.username ASC
    `
  );

  return Response.json(rows);
}
