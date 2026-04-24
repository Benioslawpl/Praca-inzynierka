import { cookies } from "next/headers";

import { getUserFromRequest } from "../../../lib/auth";
import { audit } from "../../../../lib/audit";

export async function POST(req) {
  const user = getUserFromRequest(req);

  await audit({
    action: "logout",
    entity: "auth",
    entityId: user?.id ?? null,
    before: user
      ? { id: user.id, username: user.username, role: user.role }
      : null,
    req,
  });

  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
