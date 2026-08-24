export const ROLE_OPTIONS = [
  { value: "operator", label: "operator" },
  { value: "brygadzista", label: "brygadzista" },
  { value: "kierownik", label: "kierownik" },
  { value: "biuro", label: "biuro" },
  { value: "user", label: "user" },
  { value: "admin", label: "admin" },
];

export const ALLOWED_ROLES = new Set(ROLE_OPTIONS.map((item) => item.value));

export const MANAGER_ROLES = new Set([
  "admin",
  "brygadzista",
  "kierownik",
  "biuro",
]);

export function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  return ALLOWED_ROLES.has(role) ? role : "user";
}

export function isAdminRole(role) {
  return role === "admin";
}

export function canViewOperationalData(role) {
  return MANAGER_ROLES.has(role);
}
