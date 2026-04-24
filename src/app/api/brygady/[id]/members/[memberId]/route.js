import pool from "../../../../../../../db";
import { audit } from "../../../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getIds(req, params) {
  const brygadaId = intOrNull(params?.id);
  const memberId = intOrNull(params?.memberId);

  if (brygadaId && memberId) return { brygadaId, memberId };

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idxB = parts.indexOf("brygady");
  const idxM = parts.indexOf("members");

  return {
    brygadaId: idxB >= 0 ? intOrNull(parts[idxB + 1]) : null,
    memberId: idxM >= 0 ? intOrNull(parts[idxM + 1]) : null,
  };
}

export async function PUT(req, { params }) {
  try {
    const { brygadaId, memberId } = getIds(req, params);
    if (!brygadaId || !memberId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const beforeResult = await pool.query(
      `SELECT id, imie, nazwisko, rola, telefon
       FROM brygada_czlonkowie
       WHERE id=$1 AND brygada_id=$2`,
      [memberId, brygadaId]
    );
    const before = beforeResult.rows[0];

    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const imie = body?.imie?.trim();
    const nazwisko = body?.nazwisko?.trim();
    const rola = body?.rola?.trim() || null;
    const telefon = body?.telefon?.trim() || null;

    if (!imie || !nazwisko) {
      return Response.json({ error: "Wymagane: imie i nazwisko" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE brygada_czlonkowie
       SET imie=$1, nazwisko=$2, rola=$3, telefon=$4
       WHERE id=$5 AND brygada_id=$6
       RETURNING id, imie, nazwisko, rola, telefon`,
      [imie, nazwisko, rola, telefon, memberId, brygadaId]
    );

    await audit({
      action: "update",
      entity: "members",
      entityId: memberId,
      before: { brygada_id: brygadaId, ...before },
      after: { brygada_id: brygadaId, ...rows[0] },
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { brygadaId, memberId } = getIds(req, params);
    if (!brygadaId || !memberId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `DELETE FROM brygada_czlonkowie
       WHERE id=$1 AND brygada_id=$2
       RETURNING id, imie, nazwisko, rola, telefon`,
      [memberId, brygadaId]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({
      action: "delete",
      entity: "members",
      entityId: memberId,
      before: { brygada_id: brygadaId, ...rows[0] },
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
