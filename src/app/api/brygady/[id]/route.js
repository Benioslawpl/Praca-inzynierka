import pool from "../../../../../db";

function parseId(params) {
  const id = Number(params?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// PUT /api/brygady/:id
export async function PUT(req, { params }) {
  try {
    const id = parseId(params);
    if (!id) return Response.json({ error: "Bad id" }, { status: 400 });

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
      SET numer = $1, brygadzista = $2
      WHERE id = $3
      RETURNING id, numer, brygadzista, created_at
      `,
      [numer.trim(), brygadzista.trim(), id]
    );

    if (!rows[0]) return Response.json({ error: "Nie znaleziono brygady" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/brygady/:id
export async function DELETE(_req, { params }) {
  const client = await pool.connect();
  try {
    const id = parseId(params);
    if (!id) return Response.json({ error: "Bad id" }, { status: 400 });

    await client.query("BEGIN");

    // jeśli masz FK na członków – najpierw usuń członków
    await client.query(`DELETE FROM brygada_czlonkowie WHERE brygada_id = $1`, [id]);

    const { rows } = await client.query(
      `DELETE FROM brygady WHERE id = $1 RETURNING id`,
      [id]
    );

    await client.query("COMMIT");

    if (!rows[0]) return Response.json({ error: "Nie znaleziono brygady" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    return Response.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
