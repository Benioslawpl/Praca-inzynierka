import pool from "../../../../../../../db";
import { audit } from "../../../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getIds(req, params) {
  const sprzetId = intOrNull(params?.id);
  const detailId = intOrNull(params?.detailId);
  if (sprzetId && detailId) return { sprzetId, detailId };

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idxS = parts.indexOf("sprzet");
  const idxD = parts.indexOf("details");

  return {
    sprzetId: idxS >= 0 ? intOrNull(parts[idxS + 1]) : null,
    detailId: idxD >= 0 ? intOrNull(parts[idxD + 1]) : null,
  };
}

async function getSprzetNr(sprzetId) {
  const result = await pool.query(`SELECT nr FROM sprzet WHERE id=$1`, [sprzetId]);
  return result.rows[0]?.nr || null;
}

export async function PUT(req, { params }) {
  try {
    const { sprzetId, detailId } = getIds(req, params);
    if (!sprzetId || !detailId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const beforeResult = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi
       FROM sprzet_details
       WHERE id=$1 AND sprzet_id=$2`,
      [detailId, sprzetId]
    );
    const before = beforeResult.rows[0];

    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const data_zdarzenia = body?.data_zdarzenia || null;
    const przebieg =
      body?.przebieg === "" || body?.przebieg === null || body?.przebieg === undefined
        ? null
        : Number(body.przebieg);
    const awaria = body?.awaria?.trim() || null;
    const wykonawca = body?.wykonawca?.trim() || null;
    const uwagi = body?.uwagi?.trim() || null;
    const sprzetNr = await getSprzetNr(sprzetId);

    const { rows } = await pool.query(
      `UPDATE sprzet_details
       SET data_zdarzenia=$1, przebieg=$2, awaria=$3, wykonawca=$4, uwagi=$5
       WHERE id=$6 AND sprzet_id=$7
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [
        data_zdarzenia,
        Number.isFinite(przebieg) ? przebieg : null,
        awaria,
        wykonawca,
        uwagi,
        detailId,
        sprzetId,
      ]
    );

    await audit({
      action: "update",
      entity: "sprzet_details",
      entityId: detailId,
      before: { sprzet_id: sprzetId, sprzet_nr: sprzetNr, ...before },
      after: { sprzet_id: sprzetId, sprzet_nr: sprzetNr, ...rows[0] },
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { sprzetId, detailId } = getIds(req, params);
    if (!sprzetId || !detailId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `DELETE FROM sprzet_details
       WHERE id=$1 AND sprzet_id=$2
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [detailId, sprzetId]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

    const sprzetNr = await getSprzetNr(sprzetId);

    await audit({
      action: "delete",
      entity: "sprzet_details",
      entityId: detailId,
      before: { sprzet_id: sprzetId, sprzet_nr: sprzetNr, ...rows[0] },
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
