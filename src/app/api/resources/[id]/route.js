import pool from "../../../../../db";

// PUT update
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const { Rozdaj, Marka, Typ, Przebieg, Ostatni_Serwix, Data_Kupna } =
      await req.json();

    const { rows } = await pool.query(
      `UPDATE maszyny 
       SET "Rozdaj"=$1, "Marka"=$2, "Typ"=$3, "Przebieg"=$4, "Ostatni_Serwix"=$5, "Data_Kupna"=$6
       WHERE id=$7
       RETURNING *`,
      [Rozdaj, Marka, Typ, Number(Przebieg), Number(Ostatni_Serwix), Data_Kupna, id]
    );

    if (!rows.length) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PUT ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const { rowCount } = await pool.query("DELETE FROM maszyny WHERE id = $1", [
      id,
    ]);

    if (!rowCount) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
