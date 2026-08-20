import pool from "../../../../db";
import { getUserFromRequest } from "../../../lib/auth";
import { getVisibleMachineIdsForUser } from "../../../lib/machine-access";

async function buildMachineDashboard(machineIds, user) {
  if (!machineIds.length) {
    return {
      user,
      assignedMachines: [],
      alerts: {
        awarie: [],
        serwisSoon: [],
        serwisOverdue: [],
      },
      recentReports: [],
    };
  }

  const { rows: machines } = await pool.query(
    `SELECT m.id, m.nr, m.rodzaj, m.marka, m.model, m.operator,
            m.serwis_co_ile_mth, m.ostatni_serwis_mth,
            mo.user_id as assigned_operator_id,
            u.username as assigned_operator_username
     FROM maszyny m
     LEFT JOIN maszyna_operatorzy mo
       ON mo.maszyna_id = m.id AND mo.aktywne = true
     LEFT JOIN users u
       ON u.id = mo.user_id
     WHERE m.id = ANY($1::int[])
     ORDER BY m.nr ASC, m.id ASC`,
    [machineIds]
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
    [machineIds]
  );

  const { rows: latestActiveFailures } = await pool.query(
    `SELECT DISTINCT ON (r.maszyna_id)
            r.id, r.maszyna_id, r.data_raportu, r.motogodziny, r.awaria,
            r.opis, r.status_awarii, r.created_at,
            u.username
     FROM maszyna_raporty r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.maszyna_id = ANY($1::int[])
       AND r.awaria = true
       AND COALESCE(r.status_awarii, 'nowa') <> 'zamknieta'
     ORDER BY r.maszyna_id, r.created_at DESC, r.id DESC`,
    [machineIds]
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
    [machineIds]
  );

  const latestByMachineId = new Map(
    latestReports.map((row) => [row.maszyna_id, row])
  );
  const latestFailureByMachineId = new Map(
    latestActiveFailures.map((row) => [row.maszyna_id, row])
  );

  const awarie = [];
  const serwisSoon = [];
  const serwisOverdue = [];

  for (const machine of machines) {
    const latest = latestByMachineId.get(machine.id) || null;
    const latestFailure = latestFailureByMachineId.get(machine.id) || null;

    if (latestFailure) {
      awarie.push({
        machineId: machine.id,
        nr: machine.nr,
        opis: latestFailure.opis || "Aktywne zgłoszenie awarii",
        status: latestFailure.status_awarii || "nowa",
        date: latestFailure.data_raportu,
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

  return {
    user,
    assignedMachines: user.role === "operator" ? machines : [],
    alerts: {
      awarie,
      serwisSoon,
      serwisOverdue,
    },
    recentReports,
  };
}

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "kierownik") {
    const { rows: managedBudowy } = await pool.query(
      `SELECT
         b.id,
         b.numer,
         b.nazwa,
         b.lokalizacja,
         b.status,
         b.data_rozpoczecia,
         b.data_zakonczenia,
         COALESCE((
           SELECT COUNT(*)
           FROM budowy_brygady bb
           WHERE bb.budowa_id = b.id
         ), 0) AS brygady_count,
         COALESCE((
           SELECT COUNT(*)
           FROM budowy_maszyny bm
           WHERE bm.budowa_id = b.id
         ), 0) AS maszyny_count
       FROM budowy b
       WHERE b.kierownik = $1
       ORDER BY
         CASE
           WHEN b.status = 'w_toku' THEN 0
           WHEN b.status = 'planowana' THEN 1
           WHEN b.status = 'wstrzymana' THEN 2
           ELSE 3
         END,
         COALESCE(b.data_rozpoczecia, b.created_at) DESC,
         b.id DESC`,
      [user.username]
    );

    const budowaIds = managedBudowy.map((row) => row.id);
    const { rows: machineRows } = budowaIds.length
      ? await pool.query(
          `
          SELECT DISTINCT bm.maszyna_id
          FROM budowy_maszyny bm
          WHERE bm.budowa_id = ANY($1::int[])
          `,
          [budowaIds]
        )
      : { rows: [] };

    const visibleMachineIds = machineRows
      .map((row) => Number(row.maszyna_id))
      .filter((value) => Number.isInteger(value) && value > 0);

    const machineDashboard = await buildMachineDashboard(visibleMachineIds, user);

    const summary = {
      activeBudowy: managedBudowy.filter((row) => row.status === "w_toku").length,
      brygady: managedBudowy.reduce(
        (sum, row) => sum + Number(row.brygady_count || 0),
        0
      ),
      maszyny: visibleMachineIds.length,
      awarie: machineDashboard.alerts.awarie.length,
    };

    return Response.json({
      ...machineDashboard,
      summary,
      managedBudowy,
      roleDashboard: "kierownik",
    });
  }

  const visibleMachineIds = await getVisibleMachineIdsForUser(user);
  return Response.json(await buildMachineDashboard(visibleMachineIds, user));
}
