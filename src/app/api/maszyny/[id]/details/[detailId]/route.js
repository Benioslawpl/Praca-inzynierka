import pool from "../../../../../../../db";
import { audit } from "../../../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getIds(req, params) {
  const maszynaId = intOrNull(params?.id);
  const detailId = intOrNull(params?.detailId);
  if (maszynaId && detailId) return { maszynaId, detailId };

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idxM = parts.indexOf("maszyny");
  const idxD = parts.indexOf("details");

  return {
    maszynaId: idxM >= 0 ? intOrNull(parts[idxM + 1]) : null,
    detailId: idxD >= 0 ? intOrNull(parts[idxD + 1]) : null,
  };
}

export async function PUT(req, { params }) {
  try {
    const { maszynaId, detailId } = getIds(req, params);
    if (!maszynaId || !detailId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const beforeResult = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi
       FROM maszyny_details
       WHERE id=$1 AND maszyna_id=$2`,
      [detailId, maszynaId]
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

    const { rows } = await pool.query(
      `UPDATE maszyny_details
       SET data_zdarzenia=$1, przebieg=$2, awaria=$3, wykonawca=$4, uwagi=$5
       WHERE id=$6 AND maszyna_id=$7
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [
        data_zdarzenia,
        Number.isFinite(przebieg) ? przebieg : null,
        awaria,
        wykonawca,
        uwagi,
        detailId,
        maszynaId,
      ]
    );

    await audit({
      action: "update",
      entity: "maszyny_details",
      entityId: detailId,
      before: { maszyna_id: maszynaId, ...before },
      after: { maszyna_id: maszynaId, ...rows[0] },
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { maszynaId, detailId } = getIds(req, params);
    if (!maszynaId || !detailId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `DELETE FROM maszyny_details
       WHERE id=$1 AND maszyna_id=$2
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi`,
      [detailId, maszynaId]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({
      action: "delete",
      entity: "maszyny_details",
      entityId: detailId,
      before: { maszyna_id: maszynaId, ...rows[0] },
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
