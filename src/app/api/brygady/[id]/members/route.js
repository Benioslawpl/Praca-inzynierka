import pool from "../../../../../../db";

// GET: /api/brygady/:id/members
export async function GET(_req, { params }) {
  try {
    const id = Number(params.id);
    const { rows } = await pool.query(
      `SELECT id, imie AS "Imie", nazwisko AS "Nazwisko", rola AS "Rola", telefon AS "Telefon"
       FROM brygada_members
       WHERE brygada_id = $1
       ORDER BY id ASC`,
      [id]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST: /api/brygady/:id/members
export async function POST(req, { params }) {
  try {
    const body = await req.json();
    // akceptuj oba formaty kluczy
    const imie     = body.Imie     ?? body.imie;
    const nazwisko = body.Nazwisko ?? body.nazwisko;
    const rola     = body.Rola     ?? body.rola ?? null;
    const telefon  = body.Telefon  ?? body.telefon ?? null;
    const id = Number(params.id);

    if (!imie || !nazwisko) {
      return Response.json({ error: "Wymagane: Imie i Nazwisko" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO brygada_members (brygada_id, imie, nazwisko, rola, telefon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, imie AS "Imie", nazwisko AS "Nazwisko", rola AS "Rola", telefon AS "Telefon"`,
      [id, imie, nazwisko, rola, telefon]
    );
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
