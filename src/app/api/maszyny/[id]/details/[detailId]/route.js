import pool from "../../../../../../../db";

// EDYCJA wpisu
export async function PUT(req, { params }) {
  try {
    const maszynaId = Number(params.id);
    const detailId = Number(params.detailId);
    const { przebieg, awaria, wykonawca, uwagi } = await req.json();

    if (awaria && awaria.length > 30)
      return Response.json({ error: "Awaria max 30 znaków" }, { status: 400 });
    if (uwagi && uwagi.length > 200)
      return Response.json({ error: "Uwagi max 200 znaków" }, { status: 400 });

    const { rows } = await pool.query(
      `UPDATE maszyny_details
       SET przebieg=$1, awaria=$2, wykonawca=$3, uwagi=$4
       WHERE id=$5 AND maszyna_id=$6
       RETURNING id, maszyna_id, przebieg, awaria, wykonawca, uwagi, created_at`,
      [przebieg ?? null, awaria || null, wykonawca || null, uwagi || null, detailId, maszynaId]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// USUNIĘCIE wpisu
export async function DELETE(_req, { params }) {
  try {
    const maszynaId = Number(params.id);
    const detailId = Number(params.detailId);
    const { rowCount } = await pool.query(
      `DELETE FROM maszyny_details
       WHERE id=$1 AND maszyna_id=$2`,
      [detailId, maszynaId]
    );
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}