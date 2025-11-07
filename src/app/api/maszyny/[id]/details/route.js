import pool from "../../../../../../db";
import { audit } from "../../../../../lib/audit";

// GET: lista wpisów szczegółów dla maszyny
export async function GET(_req, { params }) {
  try {
    const maszynaId = Number(params.id);
    const { rows } = await pool.query(
      `SELECT id, maszyna_id, przebieg, awaria, wykonawca, uwagi, data_zdarzenia, created_at
       FROM maszyny_details
       WHERE maszyna_id = $1
       ORDER BY data_zdarzenia DESC, created_at DESC, id DESC`,
      [maszynaId]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST: dodaj wpis (audyt create)
export async function POST(req, { params }) {
  try {
    const maszynaId = Number(params.id);
    const { przebieg, awaria, wykonawca, uwagi, data_zdarzenia } = await req.json();

    if (awaria && awaria.length > 30)
      return Response.json({ error: "Awaria max 30 znaków" }, { status: 400 });
    if (uwagi && uwagi.length > 200)
      return Response.json({ error: "Uwagi max 200 znaków" }, { status: 400 });

    const { rows } = await pool.query(
      `INSERT INTO maszyny_details (maszyna_id, przebieg, awaria, wykonawca, uwagi, data_zdarzenia)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, maszyna_id, przebieg, awaria, wykonawca, uwagi, data_zdarzenia, created_at`,
      [
        maszynaId,
        przebieg ?? null,
        awaria || null,
        wykonawca || null,
        uwagi || null,
        data_zdarzenia || null,
      ]
    );

    await audit({
      action: "create",
      entity: "maszyny_details",
      entityId: rows[0].id,
      after: rows[0],
      req,
    });

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}