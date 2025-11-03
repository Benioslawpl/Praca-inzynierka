import pool from "../../../../../../db";

// GET członkowie danej brygady
export async function GET(_req, { params }) {
  try {
    const id = Number(params.id);
    const { rows } = await pool.query(
      `SELECT id, brygada_id, "Imie","Nazwisko","Rola","Telefon"
       FROM brygada_czlonkowie
       WHERE brygada_id=$1
       ORDER BY id ASC`,
      [id]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST dodanie członka
export async function POST(req, { params }) {
  try {
    const id = Number(params.id);
    const { Imie, Nazwisko, Rola, Telefon } = await req.json();
    if (!Imie || !Nazwisko) {
      return Response.json({ error: "Wymagane: Imie, Nazwisko" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO brygada_czlonkowie (brygada_id,"Imie","Nazwisko","Rola","Telefon")
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, brygada_id, "Imie","Nazwisko","Rola","Telefon"`,
      [id, Imie, Nazwisko, Rola || null, Telefon || null]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}