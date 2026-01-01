import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ WAŻNE
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json({ ok: false, reason: "NO_COOKIE" }, { status: 200 });
    }

    const payload = jwt.verify(token, SECRET);
    const role = payload.role || (payload.username === "admin" ? "admin" : "user");

    return Response.json({
      ok: true,
      id: payload.id ?? null,
      username: payload.username ?? null,
      role,
      isAdmin: role === "admin",
    });
  } catch (e) {
    return Response.json(
      { ok: false, reason: "JWT_ERROR", error: e.message },
      { status: 401 }
    );
  }
}
