import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;

    if (!token) {
      return Response.json({ ok: false, reason: "NO_COOKIE" }, { status: 200 });
    }

    const payload = jwt.verify(token, SECRET);

    // normalizacja roli
    const role = payload.role || (payload.username === "admin" ? "admin" : "user");

    return Response.json({
      ok: true,
      id: payload.id ?? null,
      username: payload.username ?? null,
      role,
      isAdmin: role === "admin",
    });
  } catch (e) {
    // tu zobaczysz dokładny powód (np. JWT secret mismatch)
    return Response.json(
      { ok: false, reason: "JWT_ERROR", error: e.message },
      { status: 401 }
    );
  }
}
