export const dynamic = "force-dynamic";

import { getUserFromCookies } from "../../lib/auth";
import LogsClient from "./LogsClient";

export default async function HistoriaPage() {
  const user = getUserFromCookies();

  // zabezpieczenie przed null
  if (!user || !user.isAdmin) {
    return (
      <div className="card">
        <h2>Brak dostępu</h2>
        <p>Ta sekcja jest tylko dla administratora.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Historia zdarzeń</h1>
      <LogsClient />
    </div>
  );
}