import pool from "../../../../../../db";
import { audit } from "../../../../../lib/audit";

export async function GET(_req, { params }) {
  const id = Number(params.id);
  const { rows } = await pool.query(
    `SELECT id, imie AS "Imie", nazwisko AS "Nazwisko", rola AS "Rola", telefon AS "Telefon", created_at
     FROM brygady_members
     WHERE brygada_id=$1
     ORDER BY id ASC`,
    [id]
  );
  return Response.json(rows);
}

export async function POST(req, { params }) {
  const id = Number(params.id);
  const { Imie, Nazwisko, Rola, Telefon } = await req.json();

  const { rows } = await pool.query(
    `INSERT INTO brygady_members (brygada_id, imie, nazwisko, rola, telefon)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [id, Imie || null, Nazwisko || null, Rola || null, Telefon || null]
  );
  await audit({ action: "create", entity: "members", entityId: rows[0].id, after: rows[0], req });
  return Response.json(rows[0], { status: 201 });
}