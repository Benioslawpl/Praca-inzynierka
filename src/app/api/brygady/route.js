import pool from "../../../../db";

// POBIERZ WSZYSTKIE
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT id, numer, brygadzista, created_at
      FROM brygady
      ORDER BY COALESCE( (regexp_matches(numer, '\\d+'))[1]::INTEGER, 0 )
    `);

    return Response.json(rows);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
// DODAJ NOWĄ
export async function POST(req) {
  try {
    const { brygadzista } = await req.json();

    if (!brygadzista) {
      return Response.json({ error: "Wymagane: brygadzista" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO brygady (brygadzista)
       VALUES ($1)
       RETURNING id, numer, brygadzista, created_at`,
      [brygadzista]
    );

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}