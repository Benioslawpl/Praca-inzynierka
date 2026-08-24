import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import pool from "../../db";
import { getJwtSecret } from "./env";
import { canViewOperationalData, isAdminRole } from "./roles";

export function verifyJwt(token) {
  return jwt.verify(token, getJwtSecret());
}

async function getActiveUserByPayload(payload) {
  const id = Number(payload?.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const { rows } = await pool.query(
    `SELECT id, username, role, blocked
     FROM users
     WHERE id=$1`,
    [id]
  );

  const user = rows[0];
  if (!user || user.blocked) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isAdmin: isAdminRole(user.role),
    canViewOperations: canViewOperationalData(user.role),
  };
}

export async function getUserFromCookies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const payload = verifyJwt(token);
    return getActiveUserByPayload(payload);
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((cookie) => cookie.startsWith("token="))
      ?.split("=")[1];

    if (!token) return null;

    const payload = verifyJwt(token);
    return getActiveUserByPayload(payload);
  } catch {
    return null;
  }
}
