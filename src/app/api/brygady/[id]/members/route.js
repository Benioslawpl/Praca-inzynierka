import pool from "../../../../../../db";
import { audit } from "../../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getBrygadaId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("brygady");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

export async function GET(req, { params }) {
  try {
    const brygadaId = getBrygadaId(req, params);
    if (!brygadaId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id, imie, nazwisko, rola, telefon
       FROM brygada_czlonkowie
       WHERE brygada_id = $1
       ORDER BY id ASC`,
      [brygadaId]
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const brygadaId = getBrygadaId(req, params);
    if (!brygadaId) {
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
      `INSERT INTO brygada_czlonkowie (brygada_id, imie, nazwisko, rola, telefon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, imie, nazwisko, rola, telefon`,
      [brygadaId, imie, nazwisko, rola, telefon]
    );

    await audit({
      action: "create",
      entity: "members",
      entityId: rows[0].id,
      after: { brygada_id: brygadaId, ...rows[0] },
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
