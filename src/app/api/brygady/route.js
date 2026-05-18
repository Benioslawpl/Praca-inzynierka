import pool from "../../../../db";

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT id, numer, brygadzista, created_at
      FROM brygady
      ORDER BY CAST(regexp_replace(numer, '\\D', '', 'g') AS INTEGER) ASC NULLS LAST, numer ASC
    `);

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { numer, brygadzista } = await req.json();

    if (!numer?.trim()) {
      return Response.json({ error: "Wymagane: numer" }, { status: 400 });
    }
    if (!brygadzista?.trim()) {
      return Response.json({ error: "Wymagane: brygadzista" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO brygady (numer, brygadzista)
      VALUES ($1, $2)
      RETURNING id, numer, brygadzista, created_at
      `,
      [numer.trim(), brygadzista.trim()]
    );

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

