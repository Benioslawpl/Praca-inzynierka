import pool from "../../../../../db";
import { audit } from "../../../../lib/audit";

function getId(req, params) {
  const fromParams = Number(params?.id);
  if (Number.isInteger(fromParams) && fromParams > 0) return fromParams;

  try {
    const url = new URL(req.url);
    const last = url.pathname.split("/").filter(Boolean).pop();
    const fromPath = Number(last);
    if (Number.isInteger(fromPath) && fromPath > 0) return fromPath;
  } catch {}

  return null;
}

export async function PUT(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) {
      return Response.json({ error: "Bad id", params }, { status: 400 });
    }

    const beforeResult = await pool.query(
      `
      SELECT id, numer, brygadzista, created_at
      FROM brygady
      WHERE id=$1
      `,
      [id]
    );
    const before = beforeResult.rows[0];

    if (!before) {
      return Response.json({ error: "Nie znaleziono brygady" }, { status: 404 });
    }

    const { numer, brygadzista } = await req.json();

    if (!numer?.trim()) {
      return Response.json({ error: "Wymagane: numer" }, { status: 400 });
    }
    if (!brygadzista?.trim()) {
      return Response.json({ error: "Wymagane: brygadzista" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `
      UPDATE brygady
      SET numer=$1, brygadzista=$2
      WHERE id=$3
      RETURNING id, numer, brygadzista, created_at
      `,
      [numer.trim(), brygadzista.trim(), id]
    );

    await audit({
      action: "update",
      entity: "brygady",
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
  const client = await pool.connect();

  try {
    const id = getId(req, params);
    if (!id) {
      return Response.json({ error: "Bad id", params }, { status: 400 });
    }

    await client.query("BEGIN");

    const beforeResult = await client.query(
      `
      SELECT id, numer, brygadzista, created_at
      FROM brygady
      WHERE id=$1
      `,
      [id]
    );
    const before = beforeResult.rows[0];

    if (!before) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Nie znaleziono brygady" }, { status: 404 });
    }

    await client.query(`DELETE FROM brygada_czlonkowie WHERE brygada_id=$1`, [id]);
    await client.query(`DELETE FROM brygady WHERE id=$1`, [id]);
    await client.query("COMMIT");

    await audit({
      action: "delete",
      entity: "brygady",
      entityId: id,
      before,
      req,
    });

    return Response.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
