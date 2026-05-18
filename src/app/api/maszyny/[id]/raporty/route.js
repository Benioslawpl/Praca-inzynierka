import pool from "../../../../../../db";
import { getUserFromRequest } from "../../../../../lib/auth";
import { canAccessMachine } from "../../../../../lib/machine-access";

function getMachineId(req, params) {
  const value = Number(params?.id);
  if (Number.isInteger(value) && value > 0) return value;

  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("maszyny");
  const fromPath = Number(parts[idx + 1]);
  return Number.isInteger(fromPath) && fromPath > 0 ? fromPath : null;
}

export async function GET(req, ctx) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maszynaId = getMachineId(req, ctx?.params);
  if (!maszynaId) {
    return Response.json({ error: "Bad id" }, { status: 400 });
  }

  const allowed = await canAccessMachine(user, maszynaId);
  if (!allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pool.query(
    `SELECT r.id,
            r.maszyna_id,
            r.user_id,
            r.data_raportu,
            r.motogodziny,
            r.awaria,
            r.opis,
            r.status_awarii,
            r.created_at,
            u.username
     FROM maszyna_raporty r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.maszyna_id=$1
     ORDER BY r.created_at DESC, r.id DESC`,
    [maszynaId]
  );

  return Response.json(rows);
}

export async function POST(req, ctx) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maszynaId = getMachineId(req, ctx?.params);
  if (!maszynaId) {
    return Response.json({ error: "Bad id" }, { status: 400 });
  }

  const allowed = await canAccessMachine(user, maszynaId);
  if (!allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dataRaportu = String(body.data_raportu || "").trim() || null;
  const motogodziny =
    body.motogodziny === "" || body.motogodziny === null || body.motogodziny === undefined
      ? null
      : Number(body.motogodziny);
  const awaria = !!body.awaria;
  const opis = String(body.opis || "").trim();
  const statusAwarii = awaria
    ? String(body.status_awarii || "nowa").trim() || "nowa"
    : "brak";

  if (!dataRaportu) {
    return Response.json({ error: "Wymagana: data raportu" }, { status: 400 });
  }

  if (motogodziny !== null && Number.isNaN(motogodziny)) {
    return Response.json({ error: "Nieprawidłowe motogodziny" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO maszyna_raporty (
       maszyna_id, user_id, data_raportu, motogodziny, awaria, opis, status_awarii
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [maszynaId, user.id, dataRaportu, motogodziny, awaria, opis || null, statusAwarii]
  );

  if (motogodziny !== null || awaria || opis) {
    await pool.query(
      `INSERT INTO maszyny_details (
         maszyna_id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        maszynaId,
        dataRaportu,
        motogodziny,
        awaria ? opis || "Zgłoszenie awarii od operatora" : null,
        user.username || "operator",
        opis || null,
        "operator",
        user.username || null,
      ]
    );
  }

  return Response.json(rows[0], { status: 201 });
}
