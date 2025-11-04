import pool from "../../../../../../db";

// LISTA członków brygady
export async function GET(_req, { params }) {
  try {
    const id = Number(params.id);
    const { rows } = await pool.query(
      `SELECT id, brygada_id, imie, nazwisko, rola, telefon
       FROM brygada_czlonkowie
       WHERE brygada_id = $1
       ORDER BY id ASC`,
      [id]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DODAJ członka
export async function POST(req, { params }) {
  try {
    const id = Number(params.id);
    const { imie, nazwisko, rola, telefon } = await req.json();
    if (!imie || !nazwisko) {
      return Response.json({ error: "Wymagane: imie, nazwisko" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO brygada_czlonkowie (brygada_id, imie, nazwisko, rola, telefon)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, brygada_id, imie, nazwisko, rola, telefon`,
      [id, imie, nazwisko, rola || null, telefon || null]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}