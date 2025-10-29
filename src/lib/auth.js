import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!";

export function getUserFromCookies(cookieStore) {
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET); // { id, username, role }
  } catch {
    return null;
  }
}

export function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    const err = new Error("Brak uprawnień");
    err.status = 403;
    throw err;
  }
}