import pool from "../../db";

export async function getVisibleMachineIdsForUser(user) {
  if (!user?.id) return [];

  if (user.isAdmin || user.canViewOperations) {
    const { rows } = await pool.query(`SELECT id FROM maszyny ORDER BY id ASC`);
    return rows.map((row) => row.id);
  }

  const { rows } = await pool.query(
    `SELECT maszyna_id
     FROM maszyna_operatorzy
     WHERE user_id=$1 AND aktywne = true`,
    [user.id]
  );

  return rows.map((row) => row.maszyna_id);
}

export async function canAccessMachine(user, machineId) {
  if (!user?.id || !Number.isInteger(Number(machineId))) return false;
  if (user.isAdmin || user.canViewOperations) return true;

  const { rowCount } = await pool.query(
    `SELECT 1
     FROM maszyna_operatorzy
     WHERE user_id=$1 AND maszyna_id=$2 AND aktywne = true`,
    [user.id, Number(machineId)]
  );

  return rowCount > 0;
}

export async function setActiveOperatorForMachine(req, machineId, userId) {
  await pool.query(
    `UPDATE maszyna_operatorzy
     SET aktywne = false,
         data_do = current_date
     WHERE maszyna_id = $1 AND aktywne = true`,
    [machineId]
  );

  if (!userId) return null;

  await pool.query(
    `UPDATE maszyna_operatorzy
     SET aktywne = false,
         data_do = current_date
     WHERE user_id = $1 AND aktywne = true`,
    [userId]
  );

  const { rows } = await pool.query(
    `INSERT INTO maszyna_operatorzy (maszyna_id, user_id, data_od, aktywne)
     VALUES ($1,$2,current_date,true)
     RETURNING *`,
    [machineId, userId]
  );

  return rows[0] || null;
}
