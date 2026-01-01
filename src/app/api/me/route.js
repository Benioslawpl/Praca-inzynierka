import { getUserFromCookies } from "../../../lib/auth";
export async function GET() {
  const user = getUserFromCookies();
  return Response.json(user);
}