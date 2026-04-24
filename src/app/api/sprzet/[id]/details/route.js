import pool from "../../../../../../db";
import { audit } from "../../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getSprzetId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("sprzet");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

export async function GET(req, { params }) {
  try {
    const sprzetId = getSprzetId(req, params);
    if (!sprzetId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi
       FROM sprzet_details
       WHERE sprzet_id = $1
       ORDER BY data_zdarzenia DESC, id DESC`,
      [sprzetId]
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const sprzetId = getSprzetId(req, params);
    if (!sprzetId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data_zdarzenia = body?.data_zdarzenia || null;
    const przebieg =
      body?.przebieg === "" || body?.przebieg === null || body?.przebieg === undefined
        ? null
        : Number(body.przebieg);
    const awaria = body?.awaria?.trim() || null;
    const wykonawca = body?.wykonawca?.trim() || null;
    const uwagi = body?.uwagi?.trim() || null;

    const sprzetResult = await pool.query(`SELECT nr FROM sprzet WHERE id=$1`, [
      sprzetId,
    ]);
    const sprzetNr = sprzetResult.rows[0]?.nr || null;

    const { rows } = await pool.query(
      `INSERT INTO sprzet_details (sprzet_id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [
        sprzetId,
        data_zdarzenia,
        Number.isFinite(przebieg) ? przebieg : null,
        awaria,
        wykonawca,
        uwagi,
      ]
    );

    await audit({
      action: "create",
      entity: "sprzet_details",
      entityId: rows[0].id,
      after: { sprzet_id: sprzetId, sprzet_nr: sprzetNr, ...rows[0] },
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
