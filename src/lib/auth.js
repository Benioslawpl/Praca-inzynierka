import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "Test123!";

export function getUserFromCookies() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return null;
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function requireAdmin() {
  const user = getUserFromCookies();
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}