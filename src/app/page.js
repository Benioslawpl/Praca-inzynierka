import HomeDashboardClient from "./HomeDashboardClient";
import { getUserFromCookies } from "../lib/auth";

export default async function HomePage() {
  const user = await getUserFromCookies();
  return <HomeDashboardClient user={user} />;
}
