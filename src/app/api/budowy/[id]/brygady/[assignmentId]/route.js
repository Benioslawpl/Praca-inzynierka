import pool from "../../../../../../../db";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getIds(req, params) {
  const budowaId = intOrNull(params?.id);
  const assignmentId = intOrNull(params?.assignmentId);
  if (budowaId && assignmentId) return { budowaId, assignmentId };

  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const budowyIdx = parts.indexOf("budowy");
  const brygadyIdx = parts.indexOf("brygady");

  return {
    budowaId: budowaId || intOrNull(parts[budowyIdx + 1]),
    assignmentId: assignmentId || intOrNull(parts[brygadyIdx + 1]),
  };
}

async function getAssignment(budowaId, assignmentId) {
  const { rows } = await pool.query(
    `SELECT
       bb.id,
       bb.budowa_id,
       bb.brygada_id,
       bb.data_od,
       bb.data_do,
       bb.uwagi,
       bld.numer AS budowa_numer,
       b.numer AS brygada_numer,
       b.brygadzista
     FROM budowy_brygady bb
     JOIN budowy bld ON bld.id = bb.budowa_id
     JOIN brygady b ON b.id = bb.brygada_id
     WHERE bb.budowa_id=$1 AND bb.id=$2`,
    [budowaId, assignmentId]
  );

  return rows[0] || null;
}

export async function PUT(req, { params }) {
  try {
    const { budowaId, assignmentId } = getIds(req, params);
    if (!budowaId || !assignmentId) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const before = await getAssignment(budowaId, assignmentId);
    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const brygadaId = intOrNull(body?.brygada_id);
    const dataOd = body?.data_od || null;
    const dataDo = body?.data_do || null;
    const uwagi = String(body?.uwagi || "").trim() || null;

    if (!brygadaId) {
      return Response.json({ error: "Wymagane: brygada" }, { status: 400 });
    }

    await pool.query(
      `UPDATE budowy_brygady
       SET brygada_id=$1, data_od=$2, data_do=$3, uwagi=$4
       WHERE budowa_id=$5 AND id=$6`,
      [brygadaId, dataOd, dataDo, uwagi, budowaId, assignmentId]
    );

    const after = await getAssignment(budowaId, assignmentId);

    return Response.json(after);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { budowaId, assignmentId } = getIds(req, params);
    if (!budowaId || !assignmentId) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const before = await getAssignment(budowaId, assignmentId);
    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    await pool.query(
      `DELETE FROM budowy_brygady
       WHERE budowa_id=$1 AND id=$2`,
      [budowaId, assignmentId]
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
