import pool from "../../../../../../db";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getBudowaId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("budowy");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

async function getBudowaNumer(budowaId) {
  const { rows } = await pool.query(`SELECT numer FROM budowy WHERE id=$1`, [budowaId]);
  return rows[0]?.numer || null;
}

export async function GET(req, { params }) {
  try {
    const budowaId = getBudowaId(req, params);
    if (!budowaId) return Response.json({ error: "Bad id" }, { status: 400 });

    const { rows } = await pool.query(
      `SELECT
         bb.id,
         bb.budowa_id,
         bb.brygada_id,
         bb.data_od,
         bb.data_do,
         bb.uwagi,
         bb.created_at,
         b.numer AS brygada_numer,
         b.brygadzista
       FROM budowy_brygady bb
       JOIN brygady b ON b.id = bb.brygada_id
       WHERE bb.budowa_id=$1
         AND COALESCE(bb.data_do, '9999-12-31') >= CURRENT_DATE
       ORDER BY COALESCE(bb.data_od, bb.created_at) DESC, bb.id DESC`,
      [budowaId]
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const budowaId = getBudowaId(req, params);
    if (!budowaId) return Response.json({ error: "Bad id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const brygadaId = intOrNull(body?.brygada_id);
    const dataOd = body?.data_od || null;
    const dataDo = body?.data_do || null;
    const uwagi = String(body?.uwagi || "").trim() || null;

    if (!brygadaId) {
      return Response.json({ error: "Wymagane: brygada" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO budowy_brygady (budowa_id, brygada_id, data_od, data_do, uwagi)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, budowa_id, brygada_id, data_od, data_do, uwagi, created_at`,
      [budowaId, brygadaId, dataOd, dataDo, uwagi]
    );

    const budowaNumer = await getBudowaNumer(budowaId);
    const { rows: metaRows } = await pool.query(
      `SELECT numer, brygadzista FROM brygady WHERE id=$1`,
      [brygadaId]
    );

    const after = {
      ...rows[0],
      budowa_numer: budowaNumer,
      brygada_numer: metaRows[0]?.numer || null,
      brygadzista: metaRows[0]?.brygadzista || null,
    };

    return Response.json(after, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
