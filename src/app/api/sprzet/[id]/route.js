import pool from "../../../../../db";
import { audit } from "../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("sprzet");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

export async function GET(req, ctx) {
  try {
    const id = getId(req, ctx?.params);
    if (!id) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator AS brygadzista,
              serwis_co_ile_mth, ostatni_serwis_mth
       FROM sprzet
       WHERE id=$1`,
      [id]
    );

    if (!rows[0]) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const beforeResult = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator AS brygadzista,
              serwis_co_ile_mth, ostatni_serwis_mth
       FROM sprzet
       WHERE id=$1`,
      [id]
    );
    const before = beforeResult.rows[0];

    if (!before) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const rodzaj = body?.rodzaj?.trim();
    const marka = body?.marka?.trim();
    const model = body?.model?.trim();
    const brygadzista = body?.brygadzista?.trim();
    const serwisCoIleMth =
      body?.serwis_co_ile_mth === "" ||
      body?.serwis_co_ile_mth === null ||
      body?.serwis_co_ile_mth === undefined
        ? null
        : Number(body.serwis_co_ile_mth);
    const ostatniSerwisMth =
      body?.ostatni_serwis_mth === "" ||
      body?.ostatni_serwis_mth === null ||
      body?.ostatni_serwis_mth === undefined
        ? before.ostatni_serwis_mth
        : Number(body.ostatni_serwis_mth);

    if (!rodzaj || !marka || !model || !brygadzista) {
      return Response.json(
        { error: "Wymagane: rodzaj, marka, model, brygadzista" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `UPDATE sprzet
       SET rodzaj=$1, marka=$2, model=$3, operator=$4,
           serwis_co_ile_mth=$5, ostatni_serwis_mth=$6
       WHERE id=$7
       RETURNING id, nr, rodzaj, marka, model, operator AS brygadzista,
                 serwis_co_ile_mth, ostatni_serwis_mth`,
      [
        rodzaj,
        marka,
        model,
        brygadzista,
        Number.isFinite(serwisCoIleMth) ? serwisCoIleMth : null,
        Number.isFinite(ostatniSerwisMth) ? ostatniSerwisMth : null,
        id,
      ]
    );

    await audit({
      action: "update",
      entity: "sprzet",
      entityId: id,
      before,
      after: rows[0],
      req,
    });

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `DELETE FROM sprzet
       WHERE id=$1
       RETURNING id, nr, rodzaj, marka, model, operator AS brygadzista,
                 serwis_co_ile_mth, ostatni_serwis_mth`,
      [id]
    );

    if (!rows[0]) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await audit({
      action: "delete",
      entity: "sprzet",
      entityId: id,
      before: rows[0],
      req,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
