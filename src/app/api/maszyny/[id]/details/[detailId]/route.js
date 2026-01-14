import pool from "../../../../../../../db";

function intOrNull(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// fallback: /api/maszyny/{id}/details/{detailId}
function getIds(req, params) {
  const maszynaId = intOrNull(params?.id);
  const detailId = intOrNull(params?.detailId);
  if (maszynaId && detailId) return { maszynaId, detailId };

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["api","maszyny","3","details","12"]

  const idxM = parts.indexOf("maszyny");
  const idxD = parts.indexOf("details");

  const m = idxM >= 0 ? intOrNull(parts[idxM + 1]) : null;
  const d = idxD >= 0 ? intOrNull(parts[idxD + 1]) : null;

  return { maszynaId: m, detailId: d };
}

// PUT /api/maszyny/:id/details/:detailId
export async function PUT(req, { params }) {
  try {
    const { maszynaId, detailId } = getIds(req, params);
    if (!maszynaId || !detailId) return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const data_zdarzenia = body?.data_zdarzenia || null;
    const przebieg = body?.przebieg === "" || body?.przebieg === null || body?.przebieg === undefined
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
      [data_zdarzenia, Number.isFinite(przebieg) ? przebieg : null, awaria, wykonawca, uwagi, detailId, maszynaId]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/maszyny/:id/details/:detailId
export async function DELETE(req, { params }) {
  try {
    const { maszynaId, detailId } = getIds(req, params);
    if (!maszynaId || !detailId) return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });

    const { rowCount } = await pool.query(
      `DELETE FROM maszyny_details WHERE id=$1 AND maszyna_id=$2`,
      [detailId, maszynaId]
    );

    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
