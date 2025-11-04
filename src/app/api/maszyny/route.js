import pool from "../../../../db";

// LISTA
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator, created_at
       FROM maszyny
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
    const { nr, rodzaj, marka, model, operator } = await req.json();
    if (!nr || !rodzaj || !marka || !model || !operator) {
      return Response.json({ error: "Wymagane: nr, rodzaj, marka, model, operator" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO maszyny (nr, rodzaj, marka, model, operator)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, nr, rodzaj, marka, model, operator, created_at`,
      [nr, rodzaj, marka, model, operator]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}