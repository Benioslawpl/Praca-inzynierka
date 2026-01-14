import pool from "../../../../../db";

function intOrNull(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// fallback: /api/maszyny/{id}/details
function getMaszynaId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["api","maszyny","3","details"]
  const idx = parts.indexOf("maszyny");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

// GET /api/maszyny/:id/details
export async function GET(req, { params }) {
  try {
    const maszynaId = getMaszynaId(req, params);
    if (!maszynaId) return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });

    const { rows } = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi
       FROM maszyny_details
       WHERE maszyna_id = $1
       ORDER BY data_zdarzenia DESC, id DESC`,
      [maszynaId]
    );

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/maszyny/:id/details
export async function POST(req, { params }) {
  try {
    const maszynaId = getMaszynaId(req, params);
    if (!maszynaId) return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const data_zdarzenia = body?.data_zdarzenia || null; // "YYYY-MM-DD"
    const przebieg = body?.przebieg === "" || body?.przebieg === null || body?.przebieg === undefined
      ? null
      : Number(body.przebieg);

    const awaria = body?.awaria?.trim() || null;
    const wykonawca = body?.wykonawca?.trim() || null;
    const uwagi = body?.uwagi?.trim() || null;

    const { rows } = await pool.query(
      `INSERT INTO maszyny_details (maszyna_id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [maszynaId, data_zdarzenia, Number.isFinite(przebieg) ? przebieg : null, awaria, wykonawca, uwagi]
    );

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
