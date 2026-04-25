import bcrypt from "bcryptjs";

import pool from "../../../../db";
import { getUserFromRequest } from "../../../lib/auth";
import { audit } from "../../../lib/audit";
import { normalizeRole } from "../../../lib/roles";

export const runtime = "nodejs";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.role, u.created_at, u.blocked,
           um.maszyna_id as assigned_machine_id,
           m.nr as assigned_machine_nr
    FROM users u
    LEFT JOIN user_maszyny um ON um.user_id = u.id
    LEFT JOIN maszyny m ON m.id = um.maszyna_id
    ORDER BY u.id ASC
  `);

  return Response.json(rows);
}

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const role = normalizeRole(body.role);
  const blocked = !!body.blocked;
  const assignedMachineId = Number(body.assigned_machine_id) || null;

  if (!username || !password) {
    return Response.json(
      { error: "Wymagane: username i password" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role, blocked)
     VALUES ($1,$2,$3,$4)
     RETURNING id, username, role, created_at, blocked`,
    [username, hash, role, blocked]
  );

  if (assignedMachineId) {
    await pool.query(
      `INSERT INTO user_maszyny (user_id, maszyna_id)
       VALUES ($1,$2)`,
      [rows[0].id, assignedMachineId]
    );
  }

  const { rows: withAssignmentRows } = await pool.query(
    `SELECT u.id, u.username, u.role, u.created_at, u.blocked,
            um.maszyna_id as assigned_machine_id,
            m.nr as assigned_machine_nr
     FROM users u
     LEFT JOIN user_maszyny um ON um.user_id = u.id
     LEFT JOIN maszyny m ON m.id = um.maszyna_id
     WHERE u.id=$1`,
    [rows[0].id]
  );

  await audit({
    action: "create",
    entity: "users",
    entityId: rows[0].id,
    after: withAssignmentRows[0] || rows[0],
    req,
  });

  return Response.json(withAssignmentRows[0] || rows[0]);
}
