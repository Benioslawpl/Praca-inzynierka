import pool from "../../../../../../../db";
import { audit } from "../../../../../../lib/audit";

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
  const maszynyIdx = parts.indexOf("maszyny");

  return {
    budowaId: budowaId || intOrNull(parts[budowyIdx + 1]),
    assignmentId: assignmentId || intOrNull(parts[maszynyIdx + 1]),
  };
}

async function getAssignment(budowaId, assignmentId) {
  const { rows } = await pool.query(
    `SELECT
       bm.id,
       bm.budowa_id,
       bm.maszyna_id,
       bm.data_od,
       bm.data_do,
       bm.uwagi,
       bld.numer AS budowa_numer,
       m.nr,
       m.rodzaj,
       m.marka,
       m.model
     FROM budowy_maszyny bm
     JOIN budowy bld ON bld.id = bm.budowa_id
     JOIN maszyny m ON m.id = bm.maszyna_id
     WHERE bm.budowa_id=$1 AND bm.id=$2`,
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
         AND id <> $2
         AND COALESCE(data_do, '9999-12-31') >= COALESCE($3::date, '0001-01-01')
         AND COALESCE($4::date, '9999-12-31') >= COALESCE(data_od, '0001-01-01')
       LIMIT 1`,
      [maszynaId, assignmentId, dataOd, dataDo]
    );

    if (overlapRows[0]) {
      return Response.json(
        { error: "Ta maszyna jest już przypisana do budowy w tym zakresie dat." },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE budowy_maszyny
       SET maszyna_id=$1, data_od=$2, data_do=$3, uwagi=$4
       WHERE budowa_id=$5 AND id=$6`,
      [maszynaId, dataOd, dataDo, uwagi, budowaId, assignmentId]
    );

    const after = await getAssignment(budowaId, assignmentId);

    await audit({
      action: "update",
      entity: "budowy_maszyny",
      entityId: assignmentId,
      before,
      after,
      req,
    });

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
      `DELETE FROM budowy_maszyny
       WHERE budowa_id=$1 AND id=$2`,
      [budowaId, assignmentId]
    );

    await audit({
      action: "delete",
      entity: "budowy_maszyny",
      entityId: assignmentId,
      before,
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
