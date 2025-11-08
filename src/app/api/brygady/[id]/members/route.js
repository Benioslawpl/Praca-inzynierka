import pool from "../../../../../../db";

// GET /api/brygady/:id/members
export async function GET(_req, { params }) {
  try {
    const brygadaId = Number(params.id);
    const { rows } = await pool.query(
      `SELECT
         id,
         imie,
         nazwisko,
         rola,
         telefon
       FROM brygada_czlonkowie
       WHERE brygada_id = $1
       ORDER BY id ASC`,
      [brygadaId]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/brygady/:id/members
export async function POST(req, { params }) {
  try {
    const body = await req.json();
    // akceptuj oba formaty kluczy z frontu
    const imie     = body.imie     ?? body.Imie;
    const nazwisko = body.nazwisko ?? body.Nazwisko;
    const rola     = body.rola     ?? body.Rola ?? null;
    const telefon  = body.telefon  ?? body.Telefon ?? null;

    if (!imie || !nazwisko) {
      return Response.json({ error: "Wymagane: imie i nazwisko" }, { status: 400 });
    }

    const brygadaId = Number(params.id);
    const { rows } = await pool.query(
      `INSERT INTO brygada_czlonkowie (brygada_id, imie, nazwisko, rola, telefon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, imie, nazwisko, rola, telefon`,
      [brygadaId, imie, nazwisko, rola, telefon]
    );

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
