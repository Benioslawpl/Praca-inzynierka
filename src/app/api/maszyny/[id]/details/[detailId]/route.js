import pool from "../../../../../../../db";
import { audit } from "../../../../../../lib/audit";

// PUT: edycja wpisu (audyt update)
export async function PUT(req, { params }) {
  try {
    const maszynaId = Number(params.id);
    const detailId  = Number(params.detailId);
    const { przebieg, awaria, wykonawca, uwagi, data_zdarzenia } = await req.json();

    if (awaria && awaria.length > 30)
      return Response.json({ error: "Awaria max 30 znaków" }, { status: 400 });
    if (uwagi && uwagi.length > 200)
      return Response.json({ error: "Uwagi max 200 znaków" }, { status: 400 });

    // pobierz "before" do audytu
    const before = (await pool.query(
      `SELECT id, maszyna_id, przebieg, awaria, wykonawca, uwagi, data_zdarzenia, created_at
       FROM maszyny_details
       WHERE id=$1 AND maszyna_id=$2`,
      [detailId, maszynaId]
    )).rows[0];

    const { rows } = await pool.query(
      `UPDATE maszyny_details
       SET przebieg=$1, awaria=$2, wykonawca=$3, uwagi=$4, data_zdarzenia=$5
       WHERE id=$6 AND maszyna_id=$7
       RETURNING id, maszyna_id, przebieg, awaria, wykonawca, uwagi, data_zdarzenia, created_at`,
      [
        przebieg ?? null,
        awaria || null,
        wykonawca || null,
        uwagi || null,
        data_zdarzenia || null,
        detailId,
        maszynaId,
      ]
    );

    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({
      action: "update",
      entity: "maszyny_details",
      entityId: detailId,
      before,
      after: rows[0],
      req,
    });

    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: usuń wpis (audyt delete)
export async function DELETE(req, { params }) {
  try {
    const maszynaId = Number(params.id);
    const detailId  = Number(params.detailId);

    const before = (await pool.query(
      `SELECT id, maszyna_id, przebieg, awaria, wykonawca, uwagi, data_zdarzenia, created_at
       FROM maszyny_details
       WHERE id=$1 AND maszyna_id=$2`,
      [detailId, maszynaId]
    )).rows[0];

    const { rowCount } = await pool.query(
      `DELETE FROM maszyny_details WHERE id=$1 AND maszyna_id=$2`,
      [detailId, maszynaId]
    );

    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });

    await audit({
      action: "delete",
      entity: "maszyny_details",
      entityId: detailId,
      before,
      req,
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}