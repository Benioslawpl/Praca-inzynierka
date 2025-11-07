import { getUserFromCookie } from "../../../lib/auth";
export async function GET() { return Response.json(getUserFromCookie()); }