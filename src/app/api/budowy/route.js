import pool from "../../../../db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         numer,
         nazwa,
         lokalizacja,
         inwestor,
         kierownik,
         status,
         data_rozpoczecia,
         data_zakonczenia,
         uwagi,
         created_at
       FROM budowy
       ORDER BY COALESCE(data_rozpoczecia, created_at) DESC, id DESC`
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const numer = String(body?.numer || "").trim();
    const nazwa = String(body?.nazwa || "").trim();
    const lokalizacja = String(body?.lokalizacja || "").trim();
    const inwestor = String(body?.inwestor || "").trim() || null;
    const kierownik = String(body?.kierownik || "").trim() || null;
    const status = String(body?.status || "planowana").trim() || "planowana";
    const dataRozpoczecia = body?.data_rozpoczecia || null;
    const dataZakonczenia = body?.data_zakonczenia || null;
    const uwagi = String(body?.uwagi || "").trim() || null;

    if (!numer || !nazwa || !lokalizacja) {
      return Response.json(
        { error: "Wymagane: numer, nazwa i lokalizacja" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO budowy (
         numer,
         nazwa,
         lokalizacja,
         inwestor,
         kierownik,
         status,
         data_rozpoczecia,
         data_zakonczenia,
         uwagi
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING
         id,
         numer,
         nazwa,
         lokalizacja,
         inwestor,
         kierownik,
         status,
         data_rozpoczecia,
         data_zakonczenia,
         uwagi,
         created_at`,
      [
        numer,
        nazwa,
        lokalizacja,
        inwestor,
        kierownik,
        status,
        dataRozpoczecia,
        dataZakonczenia,
        uwagi,
      ]
    );

    return Response.json(rows[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

