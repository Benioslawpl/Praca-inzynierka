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
  const sprzetIdx = parts.indexOf("sprzet");

  return {
    budowaId: budowaId || intOrNull(parts[budowyIdx + 1]),
    assignmentId: assignmentId || intOrNull(parts[sprzetIdx + 1]),
  };
}

async function getAssignment(budowaId, assignmentId) {
  const { rows } = await pool.query(
    `SELECT
       bs.id,
       bs.budowa_id,
       bs.sprzet_id,
       bs.data_od,
       bs.data_do,
       bs.uwagi,
       bld.numer AS budowa_numer,
       s.nr,
       s.rodzaj,
       s.marka,
       s.model
     FROM budowy_sprzet bs
     JOIN budowy bld ON bld.id = bs.budowa_id
     JOIN sprzet s ON s.id = bs.sprzet_id
     WHERE bs.budowa_id=$1 AND bs.id=$2`,
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
         AND id <> $2
         AND COALESCE(data_do, '9999-12-31') >= COALESCE($3::date, '0001-01-01')
         AND COALESCE($4::date, '9999-12-31') >= COALESCE(data_od, '0001-01-01')
       LIMIT 1`,
      [sprzetId, assignmentId, dataOd, dataDo]
    );

    if (overlapRows[0]) {
      return Response.json(
        { error: "Ten sprzęt jest już przypisany do budowy w tym zakresie dat." },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE budowy_sprzet
       SET sprzet_id=$1, data_od=$2, data_do=$3, uwagi=$4
       WHERE budowa_id=$5 AND id=$6`,
      [sprzetId, dataOd, dataDo, uwagi, budowaId, assignmentId]
    );

    const after = await getAssignment(budowaId, assignmentId);

    await audit({
      action: "update",
      entity: "budowy_sprzet",
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
      `DELETE FROM budowy_sprzet
       WHERE budowa_id=$1 AND id=$2`,
      [budowaId, assignmentId]
    );

    await audit({
      action: "delete",
      entity: "budowy_sprzet",
      entityId: assignmentId,
      before,
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
