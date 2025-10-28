import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "super_tajne_haslo";

export function getUserFromCookies(cookies) {
  const token = cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET); // { id, username, iat, exp }
  } catch {
    return null;
  }
}