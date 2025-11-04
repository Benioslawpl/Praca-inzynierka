import pool from "../../../../../db";

// EDYTUJ (nie zmieniamy nr)
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { rodzaj, marka, model, operator } = await req.json();

    if (!rodzaj || !marka || !model || !operator) {
      return Response.json(
        { error: "Wymagane: rodzaj, marka, model, operator" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `UPDATE maszyny
       SET rodzaj=$1, marka=$2, model=$3, operator=$4
       WHERE id=$5
       RETURNING id, nr, rodzaj, marka, model, operator, created_at`,
      [rodzaj, marka, model, operator, id]
    );

    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}