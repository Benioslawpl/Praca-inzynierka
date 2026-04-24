import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import pool from "../../../../../db";
import { audit } from "../../../../lib/audit";

const SECRET = process.env.JWT_SECRET || "Test123!";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json(
        { error: "Wpisz login i hasło, aby się zalogować." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role, blocked
       FROM users
       WHERE username = $1`,
      [username]
    );

    const user = rows[0];

    if (!user) {
      return Response.json(
        { error: "Nie znaleziono użytkownika o takim loginie." },
        { status: 401 }
      );
    }

    if (user.blocked) {
      return Response.json(
        { error: "To konto jest zablokowane. Skontaktuj się z administratorem." },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return Response.json(
        { error: "Podane hasło jest nieprawidłowe." },
        { status: 401 }
      );
    }

    const role = user.role || (user.username === "admin" ? "admin" : "user");
    const token = jwt.sign(
      { id: user.id, username: user.username, role },
      SECRET,
      { expiresIn: "8h" }
    );

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    await audit({
      action: "login",
      entity: "auth",
      entityId: user.id,
      after: { id: user.id, username: user.username, role },
      req,
    });

    return Response.json({ ok: true, username: user.username, role });
  } catch {
    return Response.json(
      { error: "Serwer chwilowo nie odpowiada. Spróbuj ponownie za moment." },
      { status: 500 }
    );
  }
}
