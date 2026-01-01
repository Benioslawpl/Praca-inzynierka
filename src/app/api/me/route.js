import { getUserFromCookies } from "../../../lib/auth";
import { cookies } from "next/headers";
import { verifyJwt } from "../../../lib/auth";

export async function GET() {
  const token = cookies().get("token")?.value;

  // 1) czy w ogóle cookie dochodzi do serwera
  if (!token) {
    return Response.json({
      ok: false,
      reason: "NO_COOKIE_TOKEN",
      cookieNames: cookies().getAll().map(c => c.name),
    });
  }

  // 2) czy JWT się poprawnie weryfikuje
  try {
    const payload = verifyJwt(token);
    return Response.json({ ok: true, payload });
  } catch (e) {
    return Response.json({
      ok: false,
      reason: "JWT_VERIFY_FAILED",
      error: e.message,
    }, { status: 401 });
  }
}