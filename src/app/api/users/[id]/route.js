import pool from "../../../../../db";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "../../../../lib/auth";

export async function PUT(req, { params }) {
  console.log("USERS/[id] params:", params);
  const admin = getUserFromRequest(req);
  if (!admin?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "bad id", received: rawId }, { status: 400 });
  }

  const body = await req.json();

  // 🔒 blokada / odblokowanie
  if (typeof body.blocked === "boolean") {
    const { rows } = await pool.query(
      `UPDATE users SET blocked=$1 WHERE id=$2 RETURNING id, username, blocked`,
      [body.blocked, id]
    );
    return Response.json(rows[0]);
  }

  // 🔑 reset hasła
  if (body.reset_password && body.new_password) {
    const hash = await bcrypt.hash(body.new_password, 10);
    await pool.query(
      `UPDATE users SET password_hash=$1 WHERE id=$2`,
      [hash, id]
    );
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(req, { params }) {
  console.log("USERS/[id] params:", params);
  const admin = getUserFromRequest(req);
  if (!admin?.isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "bad id" }, { status: 400 });
  }

  await pool.query(`DELETE FROM users WHERE id=$1`, [id]);
  return Response.json({ ok: true });
}
