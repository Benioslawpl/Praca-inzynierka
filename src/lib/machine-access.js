import pool from "../../db";

export async function getVisibleMachineIdsForUser(user) {
  if (!user?.id) return [];

  if (user.isAdmin || user.canViewOperations) {
    const { rows } = await pool.query(`SELECT id FROM maszyny ORDER BY id ASC`);
    return rows.map((row) => row.id);
  }

  const { rows } = await pool.query(
    `SELECT maszyna_id
     FROM user_maszyny
     WHERE user_id=$1`,
    [user.id]
  );

  return rows.map((row) => row.maszyna_id);
}

export async function canAccessMachine(user, machineId) {
  if (!user?.id || !Number.isInteger(Number(machineId))) return false;
  if (user.isAdmin || user.canViewOperations) return true;

  const { rowCount } = await pool.query(
    `SELECT 1
     FROM user_maszyny
     WHERE user_id=$1 AND maszyna_id=$2`,
    [user.id, Number(machineId)]
  );

  return rowCount > 0;
}

