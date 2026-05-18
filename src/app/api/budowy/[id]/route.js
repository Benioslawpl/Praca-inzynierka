import pool from "../../../../../db";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("budowy");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

async function getBudowa(id) {
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
     WHERE id=$1`,
    [id]
  );

  return rows[0] || null;
}

export async function GET(req, ctx) {
  try {
    const id = getId(req, ctx?.params);
    if (!id) return Response.json({ error: "Bad id" }, { status: 400 });

    const row = await getBudowa(id);
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json(row);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) return Response.json({ error: "Bad id" }, { status: 400 });

    const before = await getBudowa(id);
    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

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
      `UPDATE budowy
       SET numer=$1,
           nazwa=$2,
           lokalizacja=$3,
           inwestor=$4,
           kierownik=$5,
           status=$6,
           data_rozpoczecia=$7,
           data_zakonczenia=$8,
           uwagi=$9
       WHERE id=$10
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
        id,
      ]
    );

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = getId(req, params);
    if (!id) return Response.json({ error: "Bad id" }, { status: 400 });

    const { rows } = await pool.query(
      `DELETE FROM budowy
       WHERE id=$1
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
      [id]
    );

    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
