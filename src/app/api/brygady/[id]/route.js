import pool from "../../../../../db";

// PUT update
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { Numer, Brygadzista } = await req.json();
    const { rows } = await pool.query(
      `UPDATE brygady SET "Numer"=$1, "Brygadzista"=$2
       WHERE id=$3
       RETURNING id, "Numer","Brygadzista", created_at`,
      [Numer, Brygadzista, id]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    const id = Number(params.id);
    const { rowCount } = await pool.query(`DELETE FROM brygady WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}