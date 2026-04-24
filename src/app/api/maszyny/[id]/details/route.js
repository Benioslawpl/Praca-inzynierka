import pool from "../../../../../../db";
import { audit } from "../../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getMaszynaId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("maszyny");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

export async function GET(req, { params }) {
  try {
    const maszynaId = getMaszynaId(req, params);
    if (!maszynaId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi
       FROM maszyny_details
       WHERE maszyna_id = $1
       ORDER BY data_zdarzenia DESC, id DESC`,
      [maszynaId]
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const maszynaId = getMaszynaId(req, params);
    if (!maszynaId) {
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

    const { rows } = await pool.query(
      `INSERT INTO maszyny_details (maszyna_id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [
        maszynaId,
        data_zdarzenia,
        Number.isFinite(przebieg) ? przebieg : null,
        awaria,
        wykonawca,
        uwagi,
      ]
    );

    await audit({
      action: "create",
      entity: "maszyny_details",
      entityId: rows[0].id,
      after: { maszyna_id: maszynaId, ...rows[0] },
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
