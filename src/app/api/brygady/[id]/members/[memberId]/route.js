import pool from "../../../../../../../db";

// PUT edycja członka
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const memberId = Number(params.memberId);
    const { Imie, Nazwisko, Rola, Telefon } = await req.json();
    const { rows } = await pool.query(
      `UPDATE brygada_czlonkowie
       SET "imie"=$1,"nazwisko"=$2,"rola"=$3,"telefon"=$4
       WHERE id=$5 AND brygada_id=$6
       RETURNING id, brygada_id, "imie","nazwisko","rola","telefon"`,
      [Imie, Nazwisko, Rola || null, Telefon || null, memberId, id]
    );
    if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE usunięcie członka
export async function DELETE(_req, { params }) {
  try {
    const id = Number(params.id);
    const memberId = Number(params.memberId);
    const { rowCount } = await pool.query(
      `DELETE FROM brygada_czlonkowie WHERE id=$1 AND brygada_id=$2`,
      [memberId, id]
    );
    if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}