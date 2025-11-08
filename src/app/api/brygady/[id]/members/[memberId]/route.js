import pool from "../../../../../../../db";

// PUT /api/brygady/:id/members/:memberId
export async function PUT(req, { params }) {
  try {
    const body = await req.json().catch(() => ({}));

    const imie     = body.imie     ?? body.Imie;
    const nazwisko = body.nazwisko ?? body.Nazwisko;
    const rola     = body.rola     ?? body.Rola ?? null;
    const telefon  = body.telefon  ?? body.Telefon ?? null;

    if (!imie || !nazwisko) {
      return Response.json({ error: "Wymagane: imie i nazwisko" }, { status: 400 });
    }

    const memberId  = Number(params.memberId);
    const brygadaId = Number(params.id);

    const { rows } = await pool.query(
      `UPDATE brygada_czlonkowie
         SET imie = $1, nazwisko = $2, rola = $3, telefon = $4
       WHERE id = $5::int AND brygada_id = $6::int
       RETURNING id, imie, nazwisko, rola, telefon`,
      [imie, nazwisko, rola, telefon, memberId, brygadaId]
    );

    if (!rows.length) {
      // zwykle: zły memberId albo nie należy do tej brygady
      return Response.json({ error: "Nie znaleziono członka w tej brygadzie" }, { status: 404 });
    }
    return Response.json(rows[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/brygady/:id/members/:memberId
export async function DELETE(_req, { params }) {
  try {
    const memberId  = Number(params.memberId);
    const brygadaId = Number(params.id);

    const { rowCount } = await pool.query(
      `DELETE FROM brygada_czlonkowie
        WHERE id = $1::int AND brygada_id = $2::int`,
      [memberId, brygadaId]
    );

    if (!rowCount) {
      return Response.json({ error: "Nie znaleziono członka w tej brygadzie" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}