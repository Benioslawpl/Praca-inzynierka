import pool from "../../../../../../../db";
import { getUserFromRequest } from "../../../../../../lib/auth";

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

async function getMaszynaNr(maszynaId) {
  const result = await pool.query(`SELECT nr FROM maszyny WHERE id=$1`, [maszynaId]);
  return result.rows[0]?.nr || null;
}

export async function PUT(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { maszynaId, detailId } = getIds(req, params);
    if (!maszynaId || !detailId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const beforeResult = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username
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
    const zrodlo = body?.zrodlo?.trim() || before.zrodlo || "serwis";
    const reporterUsername =
      body?.reporter_username?.trim() || before.reporter_username || null;

    if (awaria && !wykonawca) {
      return Response.json(
        { error: "Przy awarii wymagany jest wykonawca" },
        { status: 400 }
      );
    }

    const maszynaNr = await getMaszynaNr(maszynaId);

    const { rows } = await pool.query(
      `UPDATE maszyny_details
       SET data_zdarzenia=$1, przebieg=$2, awaria=$3, wykonawca=$4, uwagi=$5,
           zrodlo=$6, reporter_username=$7
       WHERE id=$8 AND maszyna_id=$9
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username`,
      [
        data_zdarzenia,
        Number.isFinite(przebieg) ? przebieg : null,
        awaria,
        wykonawca,
        uwagi,
        zrodlo,
        reporterUsername,
        detailId,
        maszynaId,
      ]
    );

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { maszynaId, detailId } = getIds(req, params);
    if (!maszynaId || !detailId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `DELETE FROM maszyny_details
       WHERE id=$1 AND maszyna_id=$2
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username`,
      [detailId, maszynaId]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

    const maszynaNr = await getMaszynaNr(maszynaId);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
