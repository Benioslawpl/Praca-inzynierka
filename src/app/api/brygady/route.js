import pool from "../../../../db";

// LISTA
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, numer, brygadzista, created_at
       FROM brygady
       ORDER BY id ASC`
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DODAJ
export async function POST(req) {
  try {
    const { numer, brygadzista } = await req.json();
    if (!numer || !brygadzista) {
      return Response.json({ error: "Wymagane: numer, brygadzista" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO brygady (numer, brygadzista)
       VALUES ($1,$2)
       RETURNING id, numer, brygadzista, created_at`,
      [numer, brygadzista]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}