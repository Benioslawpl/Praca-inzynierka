import pool from "../../../../../../db";
import { requireOperationalRole } from "../../../../../lib/api-auth";

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
    const auth = await requireOperationalRole(req);
    if (auth.error) return auth.error;

    const budowaId = getBudowaId(req, params);
    if (!budowaId) return Response.json({ error: "Bad id" }, { status: 400 });

    const { rows } = await pool.query(
      `SELECT
         bm.id,
         bm.budowa_id,
         bm.maszyna_id,
         bm.data_od,
         bm.data_do,
         bm.uwagi,
         bm.created_at,
         m.nr,
         m.rodzaj,
         m.marka,
         m.model,
         m.operator
       FROM budowy_maszyny bm
       JOIN maszyny m ON m.id = bm.maszyna_id
       JOIN budowy bd ON bd.id = bm.budowa_id
       WHERE bm.budowa_id=$1
         AND bd.status <> 'zakonczona'
         AND COALESCE(bm.data_do, '9999-12-31') >= CURRENT_DATE
       ORDER BY COALESCE(bm.data_od, bm.created_at) DESC, bm.id DESC`,
      [budowaId]
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const auth = await requireOperationalRole(req);
    if (auth.error) return auth.error;

    const budowaId = getBudowaId(req, params);
    if (!budowaId) return Response.json({ error: "Bad id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const maszynaId = intOrNull(body?.maszyna_id);
    const dataOd = body?.data_od || null;
    const dataDo = body?.data_do || null;
    const uwagi = String(body?.uwagi || "").trim() || null;

    if (!maszynaId) {
      return Response.json({ error: "Wymagane: maszyna" }, { status: 400 });
    }

    const { rows: overlapRows } = await pool.query(
      `SELECT id
       FROM budowy_maszyny
       WHERE maszyna_id=$1
         AND budowa_id IN (
           SELECT id FROM budowy WHERE status <> 'zakonczona'
         )
         AND COALESCE(data_do, '9999-12-31') >= COALESCE($2::date, '0001-01-01')
         AND COALESCE($3::date, '9999-12-31') >= COALESCE(data_od, '0001-01-01')
       LIMIT 1`,
      [maszynaId, dataOd, dataDo]
    );

    if (overlapRows[0]) {
      return Response.json(
        { error: "Ta maszyna jest już przypisana do budowy w tym zakresie dat." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO budowy_maszyny (budowa_id, maszyna_id, data_od, data_do, uwagi)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, budowa_id, maszyna_id, data_od, data_do, uwagi, created_at`,
      [budowaId, maszynaId, dataOd, dataDo, uwagi]
    );

    const budowaNumer = await getBudowaNumer(budowaId);
    const { rows: metaRows } = await pool.query(
      `SELECT nr, rodzaj, marka, model, operator FROM maszyny WHERE id=$1`,
      [maszynaId]
    );

    const after = {
      ...rows[0],
      budowa_numer: budowaNumer,
      nr: metaRows[0]?.nr || null,
      rodzaj: metaRows[0]?.rodzaj || null,
      marka: metaRows[0]?.marka || null,
      model: metaRows[0]?.model || null,
      operator: metaRows[0]?.operator || null,
    };

    return Response.json(after, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
