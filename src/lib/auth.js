import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!";

export function getUserFromCookies(cookies) {
  const token = cookies.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET); // { id, username, iat, exp }
  } catch {
    return null;
  }
}