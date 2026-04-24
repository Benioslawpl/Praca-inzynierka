import pool from "../../db";
import { getUserFromCookies, getUserFromRequest } from "./auth";

async function getAuditUser(req) {
  const fromRequest = req ? await getUserFromRequest(req) : null;
  if (fromRequest) return fromRequest;

  const fromCookies = await getUserFromCookies();
  if (fromCookies) return fromCookies;

  return { id: null, username: "anon", role: null, isAdmin: false };
}

function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
}

function diff(before, after) {
  if (!before || !after) return null;

  const out = [];

  for (const key of Object.keys({ ...before, ...after })) {
    const from = normalizeValue(before[key]);
    const to = normalizeValue(after[key]);

    if (JSON.stringify(from) !== JSON.stringify(to)) {
      out.push({ field: key, from, to });
    }
  }

  return out.length ? out : null;
}

function compactRow(row) {
  if (!row) return null;

  const entries = Object.entries(row)
    .map(([key, value]) => [key, normalizeValue(value)])
    .filter(([, value]) => value !== null);

  return entries.length ? Object.fromEntries(entries) : null;
}

export async function audit({ action, entity, entityId, before, after, req }) {
  const user = await getAuditUser(req);
  const ip =
    req?.headers?.get?.("x-forwarded-for") ||
    req?.headers?.get?.("x-real-ip") ||
    "unknown";

  const compactBefore = compactRow(before);
  const compactAfter = compactRow(after);
  const changes =
    action === "update" ? diff(compactBefore, compactAfter) : null;

  await pool.query(
    `INSERT INTO audit_logs (at, user_id, username, action, entity, entity_id, changes, before_row, after_row, ip)
     VALUES (now(), $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9)`,
    [
      user.id,
      user.username,
      action,
      entity,
      entityId ?? null,
      changes ? JSON.stringify(changes) : null,
      compactBefore ? JSON.stringify(compactBefore) : null,
      compactAfter ? JSON.stringify(compactAfter) : null,
      ip,
    ]
  );
}
