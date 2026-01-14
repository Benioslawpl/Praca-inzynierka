import pool from "../../../../../db";

// GET /api/brygady/:id/members
export async function GET(_req, { params }) {
  try {
    const brygadaId = Number(params.id);

    if (!Number.isInteger(brygadaId)) {
      return Response.json({ error: "Bad id" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `
      SELECT id, imie, nazwisko, rola, telefon
      FROM brygada_czlonkowie
      WHERE brygada_id = $1
      ORDER BY id ASC
      `,
      [brygadaId]
    );

    return Response.json(rows);
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
