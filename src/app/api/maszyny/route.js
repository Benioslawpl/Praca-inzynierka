import pool from "../../../../db";

// LISTA
export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, nr, rodzaj, marka, model, operator, created_at
     FROM maszyny
     ORDER BY id ASC`
  );
  return Response.json(rows);
}

// DODAJ (bez wymogu nr)
export async function POST(req) {
  try {
    const { rodzaj, marka, model, operator } = await req.json();

    if (!rodzaj || !marka || !model || !operator) {
      return Response.json(
        { error: "Wymagane: rodzaj, marka, model, operator" },
        { status: 400 }
      );
    }

    // nr generuje trigger w DB
    const { rows } = await pool.query(
      `INSERT INTO maszyny (rodzaj, marka, model, operator)
       VALUES ($1,$2,$3,$4)
       RETURNING id, nr, rodzaj, marka, model, operator, created_at`,
      [rodzaj, marka, model, operator]
    );

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}