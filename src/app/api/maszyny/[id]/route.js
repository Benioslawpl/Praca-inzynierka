import pool from "../../../../../db";

// USUŃ
export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    if (!id) {
      return Response.json({ error: "Brak id" }, { status: 400 });
    }

    const { rowCount } = await pool.query(
      "DELETE FROM maszyny WHERE id = $1",
      [id]
    );

    if (!rowCount) {
      return Response.json({ error: "Nie znaleziono" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

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