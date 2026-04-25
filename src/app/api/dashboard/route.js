import pool from "../../../../db";
import { getUserFromRequest } from "../../../lib/auth";
import { getVisibleMachineIdsForUser } from "../../../lib/machine-access";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const visibleMachineIds = await getVisibleMachineIdsForUser(user);

  if (!visibleMachineIds.length) {
    return Response.json({
      user,
      assignedMachines: [],
      alerts: {
        awarie: [],
        serwisSoon: [],
        serwisOverdue: [],
      },
      recentReports: [],
    });
  }

  const { rows: machines } = await pool.query(
    `SELECT m.id, m.nr, m.rodzaj, m.marka, m.model, m.operator,
            m.serwis_co_ile_mth, m.ostatni_serwis_mth,
            um.user_id as assigned_user_id
     FROM maszyny m
     LEFT JOIN user_maszyny um ON um.maszyna_id = m.id
     WHERE m.id = ANY($1::int[])
     ORDER BY m.nr ASC, m.id ASC`,
    [visibleMachineIds]
  );

  const { rows: latestReports } = await pool.query(
    `SELECT DISTINCT ON (r.maszyna_id)
            r.id, r.maszyna_id, r.data_raportu, r.motogodziny, r.awaria,
            r.opis, r.status_awarii, r.created_at,
            u.username
     FROM maszyna_raporty r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.maszyna_id = ANY($1::int[])
     ORDER BY r.maszyna_id, r.created_at DESC, r.id DESC`,
    [visibleMachineIds]
  );

  const { rows: recentReports } = await pool.query(
    `SELECT r.id, r.maszyna_id, r.data_raportu, r.motogodziny, r.awaria,
            r.opis, r.status_awarii, r.created_at,
            u.username, m.nr
     FROM maszyna_raporty r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN maszyny m ON m.id = r.maszyna_id
     WHERE r.maszyna_id = ANY($1::int[])
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT 8`,
    [visibleMachineIds]
  );

  const latestByMachineId = new Map(
    latestReports.map((row) => [row.maszyna_id, row])
  );

  const awarie = [];
  const serwisSoon = [];
  const serwisOverdue = [];

  for (const machine of machines) {
    const latest = latestByMachineId.get(machine.id) || null;

    if (latest?.awaria && latest.status_awarii !== "zamknieta") {
      awarie.push({
        machineId: machine.id,
        nr: machine.nr,
        opis: latest.opis || "Aktywne zgłoszenie awarii",
        status: latest.status_awarii || "nowa",
        date: latest.data_raportu,
      });
    }

    const interval = Number(machine.serwis_co_ile_mth);
    const lastService = Number(machine.ostatni_serwis_mth);
    const currentHours = Number(latest?.motogodziny);

    if (
      Number.isFinite(interval) &&
      interval > 0 &&
      Number.isFinite(lastService) &&
      Number.isFinite(currentHours)
    ) {
      const nextServiceAt = lastService + interval;
      const remaining = nextServiceAt - currentHours;

      const payload = {
        machineId: machine.id,
        nr: machine.nr,
        currentHours,
        nextServiceAt,
        remaining,
      };

      if (remaining < 0) {
        serwisOverdue.push(payload);
      } else if (remaining <= 20) {
        serwisSoon.push(payload);
      }
    }
  }

  return Response.json({
    user,
    assignedMachines: user.role === "operator" ? machines : [],
    alerts: {
      awarie,
      serwisSoon,
      serwisOverdue,
    },
    recentReports,
  });
}
