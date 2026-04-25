import pool from "../../../../db";
import { getUserFromRequest } from "../../../lib/auth";
import { getVisibleMachineIdsForUser } from "../../../lib/machine-access";
import { audit } from "../../../lib/audit";

// GET list
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const visibleIds = await getVisibleMachineIdsForUser(user);
    if (!visibleIds.length) {
      return Response.json([]);
    }

    const { rows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model, operator,
              serwis_co_ile_mth, ostatni_serwis_mth, created_at
       FROM maszyny
       WHERE id = ANY($1::int[])
       ORDER BY id ASC`,
      [visibleIds]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST create (nr nadaje trigger w DB)
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rodzaj, marka, model, operator, serwis_co_ile_mth, ostatni_serwis_mth } =
      await req.json();
    if (!rodzaj || !marka || !model || !operator) {
      return Response.json({ error: "Wymagane: rodzaj, marka, model, operator" }, { status: 400 });
    }

    const serviceEvery =
      serwis_co_ile_mth === "" || serwis_co_ile_mth === null || serwis_co_ile_mth === undefined
        ? null
        : Number(serwis_co_ile_mth);
    const lastServiceHours =
      ostatni_serwis_mth === "" || ostatni_serwis_mth === null || ostatni_serwis_mth === undefined
        ? null
        : Number(ostatni_serwis_mth);

    const { rows } = await pool.query(
      `INSERT INTO maszyny (rodzaj, marka, model, operator, serwis_co_ile_mth, ostatni_serwis_mth)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [rodzaj, marka, model, operator, serviceEvery, lastServiceHours]
    );
    await audit({ action: "create", entity: "maszyny", entityId: rows[0].id, after: rows[0], req });
    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
