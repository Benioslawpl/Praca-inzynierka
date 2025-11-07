import pool from "../../db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!";

export function getUser() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return { id: null, username: "anon", isAdmin: false };
    const p = jwt.verify(token, SECRET);
    return { id: p.id ?? null, username: p.username ?? "anon", isAdmin: p.role === "admin" || p.username === "admin" };
  } catch {
    return { id: null, username: "anon", isAdmin: false };
  }
}

function diff(before, after) {
  if (!before || !after) return null;
  const out = [];
  for (const k of Object.keys({ ...before, ...after })) {
    const a = after[k], b = before[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ field: k, from: b, to: a });
  }
  return out;
}

export async function audit({ action, entity, entityId, before, after, req }) {
  const u = getUser();
  const ip =
    req?.headers?.get?.("x-forwarded-for") ||
    req?.headers?.get?.("x-real-ip") ||
    "unknown";

  await pool.query(
    `INSERT INTO audit_logs (at, user_id, username, action, entity, entity_id, changes, before_row, after_row, ip)
     VALUES (now(), $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9)`,
    [
      u.id,
      u.username,
      action,
      entity,
      entityId ?? null,
      action === "update" ? JSON.stringify(diff(before, after)) : null,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      ip,
    ]
  );
}