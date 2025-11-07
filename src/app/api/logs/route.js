import pool from "../../../../db";
import { audit } from "../../../lib/audit";

// GET list
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, numer, brygadzista, created_at
       FROM brygady
       ORDER BY CAST(SUBSTRING(numer FROM 3) AS INTEGER) ASC`
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST create (jeśli numer nadaje trigger w DB – nie wysyłamy numeru)
export async function POST(req) {
  try {
    const { brygadzista } = await req.json();
    if (!brygadzista) {
      return Response.json({ error: "Wymagane: brygadzista" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO brygady (brygadzista)
       VALUES ($1)
       RETURNING *`,
      [brygadzista]
    );
    await audit({ action: "create", entity: "brygady", entityId: rows[0].id, after: rows[0], req });
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}