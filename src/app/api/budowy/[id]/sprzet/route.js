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
         bs.id,
         bs.budowa_id,
         bs.sprzet_id,
         bs.data_od,
         bs.data_do,
         bs.uwagi,
         bs.created_at,
         s.nr,
         s.rodzaj,
         s.marka,
         s.model
       FROM budowy_sprzet bs
       JOIN sprzet s ON s.id = bs.sprzet_id
       WHERE bs.budowa_id=$1
       ORDER BY COALESCE(bs.data_od, bs.created_at) DESC, bs.id DESC`,
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
    const sprzetId = intOrNull(body?.sprzet_id);
    const dataOd = body?.data_od || null;
    const dataDo = body?.data_do || null;
    const uwagi = String(body?.uwagi || "").trim() || null;

    if (!sprzetId) {
      return Response.json({ error: "Wymagane: sprzęt" }, { status: 400 });
    }

    const { rows: overlapRows } = await pool.query(
      `SELECT id
       FROM budowy_sprzet
       WHERE sprzet_id=$1
         AND COALESCE(data_do, '9999-12-31') >= COALESCE($2::date, '0001-01-01')
         AND COALESCE($3::date, '9999-12-31') >= COALESCE(data_od, '0001-01-01')
       LIMIT 1`,
      [sprzetId, dataOd, dataDo]
    );

    if (overlapRows[0]) {
      return Response.json(
        { error: "Ten sprzęt jest już przypisany do budowy w tym zakresie dat." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO budowy_sprzet (budowa_id, sprzet_id, data_od, data_do, uwagi)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, budowa_id, sprzet_id, data_od, data_do, uwagi, created_at`,
      [budowaId, sprzetId, dataOd, dataDo, uwagi]
    );

    const budowaNumer = await getBudowaNumer(budowaId);
    const { rows: metaRows } = await pool.query(
      `SELECT nr, rodzaj, marka, model FROM sprzet WHERE id=$1`,
      [sprzetId]
    );

    const after = {
      ...rows[0],
      budowa_numer: budowaNumer,
      nr: metaRows[0]?.nr || null,
      rodzaj: metaRows[0]?.rodzaj || null,
      marka: metaRows[0]?.marka || null,
      model: metaRows[0]?.model || null,
    };

    return Response.json(after, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
