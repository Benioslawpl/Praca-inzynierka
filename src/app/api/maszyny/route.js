import pool from "../../../../db";
import { audit } from "../../../lib/audit";

// GET list
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator, created_at
       FROM maszyny
       ORDER BY id ASC`
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST create (nr nadaje trigger w DB)
export async function POST(req) {
  try {
    const { rodzaj, marka, model, operator } = await req.json();
    if (!rodzaj || !marka || !model || !operator) {
      return Response.json({ error: "Wymagane: rodzaj, marka, model, operator" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO maszyny (rodzaj, marka, model, operator)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [rodzaj, marka, model, operator]
    );
    await audit({ action: "create", entity: "maszyny", entityId: rows[0].id, after: rows[0], req });
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}