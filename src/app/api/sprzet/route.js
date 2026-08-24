import pool from "../../../../db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.nr, s.rodzaj, s.marka, s.model, s.operator AS brygadzista,
              s.serwis_co_ile_mth, s.ostatni_serwis_mth, s.created_at,
              (
                SELECT MAX(d.przebieg)
                FROM sprzet_details d
                WHERE d.sprzet_id = s.id
              ) AS aktualny_przebieg,
              EXISTS (
                SELECT 1
                FROM sprzet_details d
                WHERE d.sprzet_id = s.id
                  AND d.awaria IS NOT NULL
                  AND COALESCE(d.status_awarii, 'nowa') <> 'zamknieta'
              ) AS ma_aktywna_awarie
       FROM sprzet s
       ORDER BY s.id ASC`
    );

    return Response.json(rows);
  } catch (e) {
    if (e.code === "23505") {
      return Response.json(
        { error: "Sprzęt o podanym numerze już istnieje" },
        { status: 409 }
      );
    }

    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const nr = body?.nr?.trim();
    const rodzaj = body?.rodzaj?.trim();
    const marka = body?.marka?.trim();
    const model = body?.model?.trim();
    const brygadzista = body?.brygadzista?.trim();
    const serwisCoIleMth =
      body?.serwis_co_ile_mth === "" ||
      body?.serwis_co_ile_mth === null ||
      body?.serwis_co_ile_mth === undefined
        ? null
        : Number(body.serwis_co_ile_mth);
    const ostatniSerwisMth =
      body?.ostatni_serwis_mth === "" ||
      body?.ostatni_serwis_mth === null ||
      body?.ostatni_serwis_mth === undefined
        ? null
        : Number(body.ostatni_serwis_mth);

    if (!nr || !rodzaj || !marka || !model || !brygadzista) {
      return Response.json(
        { error: "Wymagane: numer, rodzaj, marka, model, brygadzista" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO sprzet (nr, rodzaj, marka, model, operator, serwis_co_ile_mth, ostatni_serwis_mth)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nr, rodzaj, marka, model, operator AS brygadzista,
                 serwis_co_ile_mth, ostatni_serwis_mth, created_at`,
      [
        nr,
        rodzaj,
        marka,
        model,
        brygadzista,
        Number.isFinite(serwisCoIleMth) ? serwisCoIleMth : null,
        Number.isFinite(ostatniSerwisMth) ? ostatniSerwisMth : null,
      ]
    );

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

