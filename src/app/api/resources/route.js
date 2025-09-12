import pool from "../../../../db";

// GET all
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, "Rozdaj", "Marka", "Typ", "Przebieg", "Ostatni_Serwix", "Data_Kupna", created_at
       FROM maszyny
       ORDER BY id DESC`
    );
    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST new
export async function POST(req) {
  try {
    const { Rozdaj, Marka, Typ, Przebieg, Ostatni_Serwix, Data_Kupna } =
      await req.json();

    const { rows } = await pool.query(
      `INSERT INTO maszyny ("Rozdaj", "Marka", "Typ", "Przebieg", "Ostatni_Serwix", "Data_Kupna")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [Rozdaj, Marka, Typ, Number(Przebieg), Number(Ostatni_Serwix), Data_Kupna]
    );

    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}