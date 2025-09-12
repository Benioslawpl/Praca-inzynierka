import pool from "../../../../db";

// GET -> pobierz wszystkie rekordy z tabeli resources
export async function GET() {
  try {
    const { rows } = await pool.query("SELECT * FROM resources ORDER BY id DESC");
    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST -> dodaj nowy rekord do tabeli resources
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, type } = body; // zakładam kolumny: id, name, type
    const { rows } = await pool.query(
      "INSERT INTO resources (name, type) VALUES ($1, $2) RETURNING *",
      [name, type]
    );
    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}