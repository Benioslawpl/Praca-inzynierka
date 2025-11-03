import pool from "../../../../../db";

// EDYTUJ
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { numer, brygadzista } = await req.json();
    const { rows } = await pool.query(
      `UPDATE brygady
       SET numer=$1, brygadzista=$2
       WHERE id=$3
       RETURNING id, numer, brygadzista, created_at`,
      [numer, brygadzista, id]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// USUŃ
export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    const { rowCount } = await pool.query(`DELETE FROM brygady WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
