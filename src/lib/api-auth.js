import { getUserFromRequest } from "./auth";

export async function requireUser(req) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requireRoles(req, allowedRoles = []) {
  const auth = await requireUser(req);
  if (auth.error) return auth;

  if (!allowedRoles.includes(auth.user.role)) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return auth;
}

export async function requireOperationalRole(req) {
  return requireRoles(req, ["admin", "biuro", "kierownik", "brygadzista"]);
}

export async function requireAdmin(req) {
  return requireRoles(req, ["admin"]);
}
