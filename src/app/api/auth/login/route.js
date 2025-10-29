import pool from "../../../../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "Test123!";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return Response.json({ error: "Brak loginu lub hasła" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id, username, password_hash, role FROM users WHERE username=$1`,
      [username]
    );
    const user = rows[0];
    if (!user) {
      return Response.json({ error: "Nieprawidłowy login" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return Response.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: "8h" }
    );

    cookies().set("token", token, { httpOnly: true, secure: true, path: "/" });

    return Response.json({ success: true, role: user.role });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}