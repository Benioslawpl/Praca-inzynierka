import pool from "../../../../../db";
import { audit } from "../../../../lib/audit";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("maszyny");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

export async function GET(req, ctx) {
  try {
    const id = getId(req, ctx?.params);
    if (!id) {
      return Response.json(
        { error: "Bad id", params: ctx?.params ?? null },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator
       FROM maszyny
       WHERE id=$1`,
      [id]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) {
      return Response.json(
        { error: "Bad id", params: params ?? null },
        { status: 400 }
      );
    }

    const beforeResult = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator
       FROM maszyny
       WHERE id=$1`,
      [id]
    );
    const before = beforeResult.rows[0];

    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const rodzaj = body?.rodzaj?.trim();
    const marka = body?.marka?.trim();
    const model = body?.model?.trim();
    const operator = body?.operator?.trim();

    if (!rodzaj || !marka || !model || !operator) {
      return Response.json(
        { error: "Wymagane: rodzaj, marka, model, operator" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `UPDATE maszyny SET rodzaj=$1, marka=$2, model=$3, operator=$4
       WHERE id=$5
       RETURNING id, nr, rodzaj, marka, model, operator`,
      [rodzaj, marka, model, operator, id]
    );

    await audit({
      action: "update",
      entity: "maszyny",
      entityId: id,
      before,
      after: rows[0],
      req,
    });

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) {
      return Response.json(
        { error: "Bad id", params: params ?? null },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `DELETE FROM maszyny WHERE id=$1
       RETURNING id, nr, rodzaj, marka, model, operator`,
      [id]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({
      action: "delete",
      entity: "maszyny",
      entityId: id,
      before: rows[0],
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
