import pool from "../../../../../../../db";
import { audit } from "../../../../../../lib/audit";

export async function PUT(req, { params }) {
  const brygadaId = Number(params.id);
  const memberId = Number(params.memberId);
  const { Imie, Nazwisko, Rola, Telefon } = await req.json();

  const before = (await pool.query(`SELECT * FROM brygady_members WHERE id=$1 AND brygada_id=$2`, [memberId, brygadaId])).rows[0];

  const { rows } = await pool.query(
    `UPDATE brygady_members
     SET imie=$1, nazwisko=$2, rola=$3, telefon=$4
     WHERE id=$5 AND brygada_id=$6
     RETURNING *`,
    [Imie || null, Nazwisko || null, Rola || null, Telefon || null, memberId, brygadaId]
  );
  if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });

  await audit({ action: "update", entity: "members", entityId: memberId, before, after: rows[0], req });
  return Response.json(rows[0]);
}

export async function DELETE(_req, { params }) {
  const brygadaId = Number(params.id);
  const memberId = Number(params.memberId);

  const before = (await pool.query(`SELECT * FROM brygady_members WHERE id=$1 AND brygada_id=$2`, [memberId, brygadaId])).rows[0];
  const { rowCount } = await pool.query(
    `DELETE FROM brygady_members WHERE id=$1 AND brygada_id=$2`,
    [memberId, brygadaId]
  );
  if (!rowCount) return Response.json({ error: "Not found" }, { status: 404 });

  await audit({ action: "delete", entity: "members", entityId: memberId, before, req: _req });
  return Response.json({ success: true });
}