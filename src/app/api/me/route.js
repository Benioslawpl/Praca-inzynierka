import { getUserFromCookies } from "../../../lib/auth";
export async function GET() { return Response.json(getUserFromCookies()); }