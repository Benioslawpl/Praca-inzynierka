import pool from "../../../../../db";

// EDYTUJ
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { nr, rodzaj, marka, model, operator } = await req.json();
    const { rows } = await pool.query(
      `UPDATE maszyny
       SET nr=$1, rodzaj=$2, marka=$3, model=$4, operator=$5
       WHERE id=$6
       RETURNING id, nr, rodzaj, marka, model, operator, created_at`,
      [nr, rodzaj, marka, model, operator, id]
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
    const { rowCount } = await pool.query(`DELETE FROM maszyny WHERE id=$1`, [id]);
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}