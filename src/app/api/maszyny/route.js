import pool from "../../../../db";
import { getUserFromRequest } from "../../../lib/auth";
import { getVisibleMachineIdsForUser, setActiveOperatorForMachine } from "../../../lib/machine-access";

async function getOperatorAccount(operatorId) {
  if (!operatorId) return null;

  const { rows } = await pool.query(
    `
    SELECT u.id, u.username
    FROM users u
    WHERE u.id = $1
      AND u.role = 'operator'
      AND COALESCE(u.blocked, false) = false
    `,
    [operatorId]
  );

  return rows[0] || null;
}

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
      `SELECT m.id, m.nr, m.rodzaj, m.marka, m.model, m.operator,
              m.serwis_co_ile_mth, m.ostatni_serwis_mth, m.created_at,
              mo.user_id as assigned_operator_id,
              u.username as assigned_operator_username
       FROM maszyny m
       LEFT JOIN maszyna_operatorzy mo
         ON mo.maszyna_id = m.id AND mo.aktywne = true
       LEFT JOIN users u
         ON u.id = mo.user_id
       WHERE m.id = ANY($1::int[])
       ORDER BY m.nr ASC, m.id ASC`,
      [visibleIds]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST create
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      nr,
      rodzaj,
      marka,
      model,
      serwis_co_ile_mth,
      ostatni_serwis_mth,
      assigned_operator_id,
    } = await req.json();
    const machineNr = String(nr || "").trim();
    const assignedOperatorId = Number(assigned_operator_id) || null;
    const operatorAccount = await getOperatorAccount(assignedOperatorId);

    if (!machineNr || !rodzaj || !marka || !model || !operatorAccount) {
      return Response.json(
        { error: "Wymagane: numer, rodzaj, marka, model, operator" },
        { status: 400 }
      );
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
      `INSERT INTO maszyny (nr, rodzaj, marka, model, operator, serwis_co_ile_mth, ostatni_serwis_mth)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        machineNr,
        rodzaj,
        marka,
        model,
        operatorAccount.username,
        serviceEvery,
        lastServiceHours,
      ]
    );

    if (assignedOperatorId) {
      await setActiveOperatorForMachine(req, rows[0].id, assignedOperatorId);
    }

    const { rows: finalRows } = await pool.query(
      `SELECT m.id, m.nr, m.rodzaj, m.marka, m.model, m.operator,
              m.serwis_co_ile_mth, m.ostatni_serwis_mth,
              mo.user_id as assigned_operator_id,
              u.username as assigned_operator_username
       FROM maszyny m
       LEFT JOIN maszyna_operatorzy mo
         ON mo.maszyna_id = m.id AND mo.aktywne = true
       LEFT JOIN users u
         ON u.id = mo.user_id
       WHERE m.id=$1`,
      [rows[0].id]
    );
    return Response.json(finalRows[0] || rows[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

