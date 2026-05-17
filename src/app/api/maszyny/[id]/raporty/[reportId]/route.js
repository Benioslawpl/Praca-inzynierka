import pool from "../../../../../../../db";
import { getUserFromRequest } from "../../../../../../lib/auth";
import { audit } from "../../../../../../lib/audit";
import { canAccessMachine } from "../../../../../../lib/machine-access";

function getIds(req, params) {
  const machineId = Number(params?.id);
  const reportId = Number(params?.reportId);

  if (Number.isInteger(machineId) && machineId > 0 && Number.isInteger(reportId) && reportId > 0) {
    return { machineId, reportId };
  }

  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const machineIndex = parts.indexOf("maszyny");
  const reportsIndex = parts.indexOf("raporty");

  const machineFromPath = Number(parts[machineIndex + 1]);
  const reportFromPath = Number(parts[reportsIndex + 1]);

  return {
    machineId: Number.isInteger(machineFromPath) && machineFromPath > 0 ? machineFromPath : null,
    reportId: Number.isInteger(reportFromPath) && reportFromPath > 0 ? reportFromPath : null,
  };
}

export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { machineId, reportId } = getIds(req, params);
  if (!machineId || !reportId) {
    return Response.json({ error: "Bad id" }, { status: 400 });
  }

  const allowed = await canAccessMachine(user, machineId);
  if (!allowed || (!user?.isAdmin && !user?.canViewOperations)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const beforeResult = await pool.query(
    `SELECT id, maszyna_id, user_id, data_raportu, motogodziny, awaria, opis, status_awarii
     FROM maszyna_raporty
     WHERE id=$1 AND maszyna_id=$2`,
    [reportId, machineId]
  );
  const before = beforeResult.rows[0];

  if (!before) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const statusAwarii = String(body?.status_awarii || before.status_awarii || "nowa").trim();

  const { rows } = await pool.query(
    `UPDATE maszyna_raporty
     SET status_awarii=$1
     WHERE id=$2 AND maszyna_id=$3
     RETURNING id, maszyna_id, user_id, data_raportu, motogodziny, awaria, opis, status_awarii`,
    [statusAwarii, reportId, machineId]
  );

  await audit({
    action: "update",
    entity: "maszyna_raporty",
    entityId: reportId,
    before,
    after: rows[0],
    req,
  });

  return Response.json(rows[0]);
}
