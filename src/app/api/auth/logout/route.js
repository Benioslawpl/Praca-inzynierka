export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      // wygaszenie cookie
      "Set-Cookie": `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    },
  });
}