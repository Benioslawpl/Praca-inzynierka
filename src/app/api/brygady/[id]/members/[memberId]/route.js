import pool from "../../../../../../../db";

// ✅ EDYTUJ istniejącego członka
export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const imie = body.Imie ?? body.imie;
    const nazwisko = body.Nazwisko ?? body.nazwisko;
    const rola = body.Rola ?? body.rola ?? null;
    const telefon = body.Telefon ?? body.telefon ?? null;

    const memberId = Number(params.memberId);
    const brygadaId = Number(params.id);

    if (!imie || !nazwisko) {
      return Response.json({ error: "Wymagane: Imię i nazwisko" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE brygada_czlonkowie
       SET imie=$1, nazwisko=$2, rola=$3, telefon=$4
       WHERE id=$5 AND brygada_id=$6
       RETURNING id, imie AS "Imie", nazwisko AS "Nazwisko", rola AS "Rola", telefon AS "Telefon"`,
      [imie, nazwisko, rola, telefon, memberId, brygadaId]
    );

    if (!rows.length)
      return Response.json({ error: "Nie znaleziono członka" }, { status: 404 });

    return Response.json(rows[0]);
  } catch (e) {
    console.error("PUT member error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// ✅ USUŃ członka brygady
export async function DELETE(_req, { params }) {
  try {
    const memberId = Number(params.memberId);
    const brygadaId = Number(params.id);

    const { rowCount } = await pool.query(
      `DELETE FROM brygada_czlonkowie WHERE id=$1 AND brygada_id=$2`,
      [memberId, brygadaId]
    );

    if (!rowCount)
      return Response.json({ error: "Nie znaleziono członka" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE member error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}