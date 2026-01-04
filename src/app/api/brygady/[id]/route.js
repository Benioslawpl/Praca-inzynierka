import pool from "../../../../../db";

function getId(req, params) {
  // 1) normalnie z params
  const p = params?.id;
  const n1 = Number(p);
  if (Number.isInteger(n1) && n1 > 0) return n1;

  // 2) fallback: z URL (ostatni segment)
  try {
    const url = new URL(req.url);
    const last = url.pathname.split("/").filter(Boolean).pop();
    const n2 = Number(last);
    if (Number.isInteger(n2) && n2 > 0) return n2;
  } catch {}

  return null;
}

// PUT /api/brygady/:id
export async function PUT(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) return Response.json({ error: "Bad id", params }, { status: 400 });

    const { numer, brygadzista } = await req.json();

    if (!numer?.trim()) return Response.json({ error: "Wymagane: numer" }, { status: 400 });
    if (!brygadzista?.trim()) return Response.json({ error: "Wymagane: brygadzista" }, { status: 400 });

    const { rows } = await pool.query(
      `
      UPDATE brygady
      SET numer=$1, brygadzista=$2
      WHERE id=$3
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
export async function DELETE(req, { params }) {
  const client = await pool.connect();
  try {
    const id = getId(req, params);
    if (!id) return Response.json({ error: "Bad id", params }, { status: 400 });

    await client.query("BEGIN");
    await client.query(`DELETE FROM brygada_czlonkowie WHERE brygada_id=$1`, [id]);
    const { rows } = await client.query(`DELETE FROM brygady WHERE id=$1 RETURNING id`, [id]);
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
