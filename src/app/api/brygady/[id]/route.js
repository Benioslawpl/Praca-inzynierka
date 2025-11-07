import pool from "../../../../../db";
import { audit } from "../../../../lib/audit";

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { brygadzista } = await req.json();
    if (!brygadzista) return Response.json({ error: "Wymagane: brygadzista" }, { status: 400 });

    const before = (await pool.query(`SELECT * FROM brygady WHERE id=$1`, [id])).rows[0];

    const { rows } = await pool.query(
      `UPDATE brygady
       SET brygadzista=$1
       WHERE id=$2
       RETURNING *`,
      [brygadzista, id]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({ action: "update", entity: "brygady", entityId: id, before, after: rows[0], req });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    const before = (await pool.query(`SELECT * FROM brygady WHERE id=$1`, [id])).rows[0];
    const { rowCount } = await pool.query(`DELETE FROM brygady WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({ action: "delete", entity: "brygady", entityId: id, before, req: _req });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}