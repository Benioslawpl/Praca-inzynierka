import pool from "../../../../../../db";
import { getUserFromRequest } from "../../../../../lib/auth";
import { audit } from "../../../../../lib/audit";

function getMachineId(req, params) {
  const value = Number(params?.id);
  if (Number.isInteger(value) && value > 0) return value;

  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("maszyny");
  const fromPath = Number(parts[idx + 1]);
  return Number.isInteger(fromPath) && fromPath > 0 ? fromPath : null;
}

export async function POST(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user?.isAdmin && !user?.canViewOperations) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const machineId = getMachineId(req, params);
  if (!machineId) {
    return Response.json({ error: "Bad id" }, { status: 400 });
  }

  const beforeResult = await pool.query(
    `SELECT id, nr, rodzaj, marka, model, operator, serwis_co_ile_mth, ostatni_serwis_mth
     FROM maszyny
     WHERE id=$1`,
    [machineId]
  );
  const before = beforeResult.rows[0];

  if (!before) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const wykonanyPrzyMth = Number(body?.wykonany_przy_mth);
  const wykonawca = String(body?.wykonawca || "").trim();
  const uwagi = String(body?.uwagi || "").trim();
  const dataZdarzenia = String(body?.data_zdarzenia || "").trim() || null;

  if (!Number.isFinite(wykonanyPrzyMth)) {
    return Response.json({ error: "Nieprawidłowy przebieg serwisowy" }, { status: 400 });
  }

  if (!wykonawca) {
    return Response.json({ error: "Wymagany wykonawca serwisu" }, { status: 400 });
  }

  await pool.query(`UPDATE maszyny SET ostatni_serwis_mth=$1 WHERE id=$2`, [
    wykonanyPrzyMth,
    machineId,
  ]);

  const afterResult = await pool.query(
    `SELECT id, nr, rodzaj, marka, model, operator, serwis_co_ile_mth, ostatni_serwis_mth
     FROM maszyny
     WHERE id=$1`,
    [machineId]
  );
  const after = afterResult.rows[0];

  await pool.query(
    `INSERT INTO maszyny_details (
       maszyna_id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      machineId,
      dataZdarzenia || new Date().toISOString().slice(0, 10),
      wykonanyPrzyMth,
      null,
      wykonawca,
      uwagi || `Wykonano serwis przy ${wykonanyPrzyMth} mth`,
      "serwis",
      user.username || null,
    ]
  );

  await audit({
    action: "update",
    entity: "maszyny",
    entityId: machineId,
    before,
    after,
    req,
  });

  return Response.json({ ok: true, machine: after });
}
