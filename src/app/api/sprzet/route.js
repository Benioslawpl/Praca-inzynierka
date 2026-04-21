import pool from "../../../../db";
import { audit } from "../../../lib/audit";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator AS brygadzista, created_at
       FROM sprzet
       ORDER BY id ASC`
    );

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rodzaj = body?.rodzaj?.trim();
    const marka = body?.marka?.trim();
    const model = body?.model?.trim();
    const brygadzista = body?.brygadzista?.trim();

    if (!rodzaj || !marka || !model || !brygadzista) {
      return Response.json(
        { error: "Wymagane: rodzaj, marka, model, brygadzista" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO sprzet (rodzaj, marka, model, operator)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nr, rodzaj, marka, model, operator AS brygadzista, created_at`,
      [rodzaj, marka, model, brygadzista]
    );

    await audit({
      action: "create",
      entity: "sprzet",
      entityId: rows[0].id,
      after: rows[0],
      req,
    });

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
