import pool from "../../../db";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    return new Response(JSON.stringify({ ok: true, time: rows[0].now }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}