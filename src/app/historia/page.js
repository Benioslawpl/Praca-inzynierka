import { getUserFromCookie } from "../../lib/auth";  // wspólna funkcja JWT
import LogsClient from "./LogsClient";

export default async function HistoriaPage() {
  const user = getUserFromCookies(); // odczyt tokena z cookies

  if (!user.isAdmin) {
    return (
      <div className="card">
        <h2>Brak dostępu</h2>
        <p>Ta sekcja jest dostępna tylko dla administratora.</p>
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