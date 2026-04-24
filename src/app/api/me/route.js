import { getUserFromCookies } from "../../../lib/auth";

export async function GET() {
  try {
    const user = await getUserFromCookies();

    if (!user) {
      return Response.json({ ok: false, reason: "NO_COOKIE" }, { status: 200 });
    }

    return Response.json({
      ok: true,
      id: user.id ?? null,
      username: user.username ?? null,
      role: user.role ?? null,
      isAdmin: !!user.isAdmin,
    });
  } catch {
    return Response.json({ ok: false, reason: "JWT_ERROR" }, { status: 401 });
  }
}
