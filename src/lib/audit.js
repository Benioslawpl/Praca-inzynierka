import pool from "../../db";
import { getUserFromCookies, getUserFromRequest } from "./auth";

async function getAuditUser(req) {
  const fromRequest = req ? getUserFromRequest(req) : null;
  if (fromRequest) return fromRequest;

  const fromCookies = await getUserFromCookies();
  if (fromCookies) return fromCookies;

  return { id: null, username: "anon", role: null, isAdmin: false };
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
  const u = await getAuditUser(req);
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
