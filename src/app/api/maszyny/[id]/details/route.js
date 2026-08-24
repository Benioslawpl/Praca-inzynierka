import pool from "../../../../../../db";
import { getUserFromRequest } from "../../../../../lib/auth";
import { canAccessMachine } from "../../../../../lib/machine-access";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getMaszynaId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("maszyny");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const maszynaId = getMaszynaId(req, params);
    if (!maszynaId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const allowed = await canAccessMachine(user, maszynaId);
    if (!allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username
       FROM maszyny_details
       WHERE maszyna_id = $1
       ORDER BY data_zdarzenia DESC, id DESC`,
      [maszynaId]
    );

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const maszynaId = getMaszynaId(req, params);
    if (!maszynaId) {
      return Response.json({ error: "Bad id", params: params ?? null }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data_zdarzenia = body?.data_zdarzenia || null;
    const przebieg =
      body?.przebieg === "" || body?.przebieg === null || body?.przebieg === undefined
        ? null
        : Number(body.przebieg);
    const awaria = body?.awaria?.trim() || null;
    const wykonawca = body?.wykonawca?.trim() || null;
    const uwagi = body?.uwagi?.trim() || null;
    const zrodlo = body?.zrodlo?.trim() || "serwis";
    const reporterUsername = body?.reporter_username?.trim() || null;

    const maszynaResult = await pool.query(`SELECT nr FROM maszyny WHERE id=$1`, [
      maszynaId,
    ]);
    const maszynaNr = maszynaResult.rows[0]?.nr || null;

    const { rows } = await pool.query(
      `INSERT INTO maszyny_details (
         maszyna_id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, data_zdarzenia, przebieg, awaria, wykonawca, uwagi, zrodlo, reporter_username`,
      [
        maszynaId,
        data_zdarzenia,
        Number.isFinite(przebieg) ? przebieg : null,
        awaria,
        wykonawca,
        uwagi,
        zrodlo,
        reporterUsername,
      ]
    );

    return Response.json(rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
