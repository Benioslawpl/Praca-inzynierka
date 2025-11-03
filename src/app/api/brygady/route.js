import pool from "../../../../db";

// GET list
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, "Numer", "Brygadzista", created_at
       FROM brygady
       ORDER BY id ASC`
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST create
export async function POST(req) {
  try {
    const { Numer, Brygadzista } = await req.json();
    if (!Numer || !Brygadzista) {
      return Response.json({ error: "Wymagane: Numer, Brygadzista" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO brygady ("Numer","Brygadzista")
       VALUES ($1,$2)
       RETURNING id, "Numer","Brygadzista", created_at`,
      [Numer, Brygadzista]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}