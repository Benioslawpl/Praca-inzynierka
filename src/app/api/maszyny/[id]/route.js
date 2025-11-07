import pool from "../../../../../db";
import { audit } from "../../../../lib/audit";

// PUT update
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { rodzaj, marka, model, operator } = await req.json();
    if (!rodzaj || !marka || !model || !operator) {
      return Response.json({ error: "Wymagane: rodzaj, marka, model, operator" }, { status: 400 });
    }

    const before = (await pool.query(`SELECT * FROM maszyny WHERE id=$1`, [id])).rows[0];

    const { rows } = await pool.query(
      `UPDATE maszyny
       SET rodzaj=$1, marka=$2, model=$3, operator=$4
       WHERE id=$5
       RETURNING *`,
      [rodzaj, marka, model, operator, id]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({ action: "update", entity: "maszyny", entityId: id, before, after: rows[0], req });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    const before = (await pool.query(`SELECT * FROM maszyny WHERE id=$1`, [id])).rows[0];
    const { rowCount } = await pool.query(`DELETE FROM maszyny WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({ action: "delete", entity: "maszyny", entityId: id, before, req: _req });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}