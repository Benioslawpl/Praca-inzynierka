import pool from "../../../../../../../db";

function intOrNull(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function getIds(req, params) {
  const sprzetId = intOrNull(params?.id);
  const detailId = intOrNull(params?.detailId);
  if (sprzetId && detailId) return { sprzetId, detailId };

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);

  const idxS = parts.indexOf("sprzet");
  const idxD = parts.indexOf("details");

  const s = idxS >= 0 ? intOrNull(parts[idxS + 1]) : null;
  const d = idxD >= 0 ? intOrNull(parts[idxD + 1]) : null;

  return { sprzetId: s, detailId: d };
}

export async function PUT(req, { params }) {
  try {
    const { sprzetId, detailId } = getIds(req, params);
    if (!sprzetId || !detailId) {
      return Response.json(
        { error: "Bad id", params: params ?? null },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const data_zdarzenia = body?.data_zdarzenia || null;
    const przebieg =
      body?.przebieg === "" ||
      body?.przebieg === null ||
      body?.przebieg === undefined
        ? null
        : Number(body.przebieg);

    const awaria = body?.awaria?.trim() || null;
    const wykonawca = body?.wykonawca?.trim() || null;
    const uwagi = body?.uwagi?.trim() || null;

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

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { sprzetId, detailId } = getIds(req, params);
    if (!sprzetId || !detailId) {
      return Response.json(
        { error: "Bad id", params: params ?? null },
        { status: 400 }
      );
    }

    const { rowCount } = await pool.query(
      `DELETE FROM sprzet_details WHERE id=$1 AND sprzet_id=$2`,
      [detailId, sprzetId]
    );

    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
