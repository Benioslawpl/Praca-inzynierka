import pool from "../../../../../../../db";

function intOrNull(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function getIds(req, params) {
  // 1) normalnie z params
  const brygadaId = intOrNull(params?.id);
  const memberId = intOrNull(params?.memberId);

  if (brygadaId && memberId) return { brygadaId, memberId };

  // 2) fallback z URL: /api/brygady/{id}/members/{memberId}
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);

  const idxB = parts.indexOf("brygady");
  const idxM = parts.indexOf("members");

  const b = idxB >= 0 ? intOrNull(parts[idxB + 1]) : null;
  const m = idxM >= 0 ? intOrNull(parts[idxM + 1]) : null;

  return { brygadaId: b, memberId: m };
}

export async function PUT(req, { params }) {
  try {
    const { brygadaId, memberId } = getIds(req, params);
    if (!brygadaId || !memberId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

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

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { brygadaId, memberId } = getIds(req, params);
    if (!brygadaId || !memberId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM brygada_czlonkowie
       WHERE id=$1 AND brygada_id=$2`,
      [memberId, brygadaId]
    );

    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
