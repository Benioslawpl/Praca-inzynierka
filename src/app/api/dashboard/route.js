import pool from "../../../../db";
import { getUserFromRequest } from "../../../lib/auth";
import { getVisibleMachineIdsForUser } from "../../../lib/machine-access";

function toPositiveIds(values) {
  return [...new Set(values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
}

function countActiveBudowy(rows) {
  return rows.filter((row) => row.status === "w_toku").length;
}

async function getMachineIdsForBudowy(budowaIds) {
  if (!budowaIds.length) return [];

  const { rows } = await pool.query(
    `SELECT DISTINCT bm.maszyna_id
     FROM budowy_maszyny bm
     JOIN budowy b ON b.id = bm.budowa_id
     WHERE bm.budowa_id = ANY($1::int[])
       AND b.status <> 'zakonczona'
       AND COALESCE(bm.data_do, '9999-12-31') >= CURRENT_DATE`,
    [budowaIds]
  );

  return toPositiveIds(rows.map((row) => row.maszyna_id));
}

async function buildMachineDashboard(machineIds, user) {
  if (!machineIds.length) {
    return {
      assignedMachines: [],
      alerts: {
        awarie: [],
        serwisSoon: [],
        serwisOverdue: [],
      },
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
    assignedMachines: user.role === "operator" ? machines : [],
    alerts: {
      awarie,
      serwisSoon,
      serwisOverdue,
    },
  };
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "admin") {
      const [
        { rows: machineRows },
        { rows: adminBudowy },
        { rows: freeMachineRows },
        { rows: adminSummaryRows },
      ] = await Promise.all([
        pool.query(`SELECT id FROM maszyny ORDER BY id ASC`),
        pool.query(
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
                 AND COALESCE(bb.data_do, '9999-12-31') >= CURRENT_DATE
             ), 0) AS brygady_count,
             COALESCE((
               SELECT COUNT(*)
               FROM budowy_maszyny bm
               WHERE bm.budowa_id = b.id
                 AND COALESCE(bm.data_do, '9999-12-31') >= CURRENT_DATE
             ), 0) AS maszyny_count
           FROM budowy b
           WHERE b.status <> 'zakonczona'
           ORDER BY
             CASE
               WHEN b.status = 'w_toku' THEN 0
               WHEN b.status = 'planowana' THEN 1
               ELSE 2
             END,
             COALESCE(b.data_rozpoczecia, b.created_at) DESC,
             b.id DESC
           LIMIT 6`
        ),
        pool.query(
          `SELECT m.id
           FROM maszyny m
           WHERE NOT EXISTS (
             SELECT 1
             FROM budowy_maszyny bm
             JOIN budowy b ON b.id = bm.budowa_id
             WHERE bm.maszyna_id = m.id
               AND b.status <> 'zakonczona'
               AND COALESCE(bm.data_do, '9999-12-31') >= CURRENT_DATE
           )`
        ),
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE status = 'w_toku') AS active_budowy
           FROM budowy`
        ),
      ]);

      const visibleMachineIds = toPositiveIds(machineRows.map((row) => row.id));
      const machineDashboard = await buildMachineDashboard(visibleMachineIds, user);

      return Response.json({
        ...machineDashboard,
        summary: {
          activeBudowy: Number(adminSummaryRows[0]?.active_budowy || 0),
          wolneMaszyny: freeMachineRows.length,
          awarie: machineDashboard.alerts.awarie.length,
          serwisy:
            machineDashboard.alerts.serwisSoon.length +
            machineDashboard.alerts.serwisOverdue.length,
        },
        adminBudowy,
        roleDashboard: "admin",
      });
    }

    if (user.role === "biuro") {
    const [
      { rows: machineRows },
      { rows: budowyRows },
      { rows: brygadyRows },
      { rows: recentBudowy },
    ] = await Promise.all([
      pool.query(`SELECT id FROM maszyny ORDER BY id ASC`),
      pool.query(`SELECT id, status FROM budowy`),
      pool.query(`SELECT id FROM brygady`),
      pool.query(
        `SELECT id, numer, nazwa, lokalizacja, status, data_rozpoczecia
         FROM budowy
         ORDER BY COALESCE(data_rozpoczecia, created_at) DESC, id DESC
         LIMIT 6`
      ),
    ]);

    const visibleMachineIds = toPositiveIds(machineRows.map((row) => row.id));
    const machineDashboard = await buildMachineDashboard(visibleMachineIds, user);

    return Response.json({
      ...machineDashboard,
      summary: {
        totalBudowy: budowyRows.length,
        activeBudowy: countActiveBudowy(budowyRows),
        brygady: brygadyRows.length,
        maszyny: visibleMachineIds.length,
        awarie: machineDashboard.alerts.awarie.length,
      },
      recentBudowy,
      roleDashboard: "biuro",
    });
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
             AND COALESCE(bb.data_do, '9999-12-31') >= CURRENT_DATE
         ), 0) AS brygady_count,
         COALESCE((
           SELECT COUNT(*)
           FROM budowy_maszyny bm
           WHERE bm.budowa_id = b.id
             AND COALESCE(bm.data_do, '9999-12-31') >= CURRENT_DATE
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
    const visibleMachineIds = await getMachineIdsForBudowy(budowaIds);

    const machineDashboard = await buildMachineDashboard(visibleMachineIds, user);
    const activeManagedBudowy = managedBudowy.filter(
      (row) => row.status !== "zakonczona"
    );

    const summary = {
      activeBudowy: countActiveBudowy(managedBudowy),
      brygady: activeManagedBudowy.reduce(
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

  if (user.role === "brygadzista") {
    const { rows: brygadyRows } = await pool.query(
      `SELECT id, numer
       FROM brygady
       WHERE brygadzista = $1
       ORDER BY numer ASC, id ASC`,
      [user.username]
    );

    const brygadaIds = brygadyRows.map((row) => row.id);
    const { rows: budowyRows } = brygadaIds.length
      ? await pool.query(
          `SELECT
             b.id,
             b.numer,
             b.nazwa,
             b.lokalizacja,
             b.status,
             b.data_rozpoczecia,
             b.created_at
           FROM budowy b
           WHERE b.status <> 'zakonczona'
             AND EXISTS (
               SELECT 1
               FROM budowy_brygady bb
               WHERE bb.budowa_id = b.id
                 AND bb.brygada_id = ANY($1::int[])
                 AND COALESCE(bb.data_do, '9999-12-31') >= CURRENT_DATE
             )
           ORDER BY
             CASE
               WHEN b.status = 'w_toku' THEN 0
               WHEN b.status = 'planowana' THEN 1
               WHEN b.status = 'wstrzymana' THEN 2
               ELSE 3
             END,
             COALESCE(b.data_rozpoczecia, b.created_at) DESC,
             b.id DESC`,
          [brygadaIds]
        )
      : { rows: [] };

    const { rows: ludzieRows } = brygadaIds.length
      ? await pool.query(
          `SELECT
             m.id,
             m.imie,
             m.nazwisko,
             m.rola,
             m.telefon
           FROM brygada_czlonkowie m
           WHERE m.brygada_id = ANY($1::int[])
           ORDER BY m.nazwisko ASC, m.imie ASC, m.id ASC`,
          [brygadaIds]
        )
      : { rows: [] };

    const { rows: sprzetRows } = await pool.query(
      `SELECT id, nr, rodzaj, marka, model
       FROM sprzet
       WHERE operator = $1
       ORDER BY nr ASC, id ASC`,
      [user.username]
    );

    return Response.json({
      summary: {
        budowy: budowyRows.length,
        ludzie: ludzieRows.length,
        sprzet: sprzetRows.length,
      },
      budowy: budowyRows,
      ludzie: ludzieRows,
      sprzet: sprzetRows,
      roleDashboard: "brygadzista",
    });
  }

    const visibleMachineIds = await getVisibleMachineIdsForUser(user);
    return Response.json(await buildMachineDashboard(visibleMachineIds, user));
  } catch (error) {
    console.error("Dashboard error:", error);
    return Response.json(
      { error: `Błąd dashboardu: ${error.message || "nieznany błąd"}` },
      { status: 500 }
    );
  }
}
