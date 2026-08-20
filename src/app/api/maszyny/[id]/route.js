import pool from "../../../../../db";
import { getUserFromRequest } from "../../../../lib/auth";
import { canAccessMachine, setActiveOperatorForMachine } from "../../../../lib/machine-access";

function intOrNull(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getId(req, params) {
  const fromParams = intOrNull(params?.id);
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("maszyny");
  if (idx >= 0 && parts[idx + 1]) return intOrNull(parts[idx + 1]);

  return null;
}

async function getMachineRow(id) {
  const { rows } = await pool.query(
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
    [id]
  );

  return rows[0] || null;
}

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

export async function GET(req, ctx) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = getId(req, ctx?.params);
    if (!id) {
      return Response.json(
        { error: "Bad id", params: ctx?.params ?? null },
        { status: 400 }
      );
    }

    const allowed = await canAccessMachine(user, id);
    if (!allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const row = await getMachineRow(id);
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = getId(req, params);
    if (!id) {
      return Response.json(
        { error: "Bad id", params: params ?? null },
        { status: 400 }
      );
    }

    const before = await getMachineRow(id);
    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const nr = body?.nr?.trim();
    const rodzaj = body?.rodzaj?.trim();
    const marka = body?.marka?.trim();
    const model = body?.model?.trim();
    const serviceEvery =
      body?.serwis_co_ile_mth === "" ||
      body?.serwis_co_ile_mth === null ||
      body?.serwis_co_ile_mth === undefined
        ? null
        : Number(body.serwis_co_ile_mth);
    const lastServiceHours =
      body?.ostatni_serwis_mth === "" ||
      body?.ostatni_serwis_mth === null ||
      body?.ostatni_serwis_mth === undefined
        ? before.ostatni_serwis_mth
        : Number(body.ostatni_serwis_mth);
    const assignedOperatorId =
      Object.prototype.hasOwnProperty.call(body || {}, "assigned_operator_id")
        ? Number(body.assigned_operator_id) || null
        : before.assigned_operator_id || null;
    const operatorAccount = await getOperatorAccount(assignedOperatorId);

    if (!nr || !rodzaj || !marka || !model || !operatorAccount) {
      return Response.json(
        { error: "Wymagane: numer, rodzaj, marka, model, operator" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE maszyny
       SET nr=$1,
           rodzaj=$2,
           marka=$3,
           model=$4,
           operator=$5,
           serwis_co_ile_mth=$6,
           ostatni_serwis_mth=$7
       WHERE id=$8`,
      [
        nr,
        rodzaj,
        marka,
        model,
        operatorAccount.username,
        serviceEvery,
        lastServiceHours,
        id,
      ]
    );

    await setActiveOperatorForMachine(req, id, assignedOperatorId);
    const after = await getMachineRow(id);

    return Response.json(after);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.isAdmin && !user?.canViewOperations) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = getId(req, params);
    if (!id) {
      return Response.json(
        { error: "Bad id", params: params ?? null },
        { status: 400 }
      );
    }

    const before = await getMachineRow(id);
    if (!before) return Response.json({ error: "Not found" }, { status: 404 });

    await pool.query(`DELETE FROM maszyny WHERE id=$1`, [id]);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
