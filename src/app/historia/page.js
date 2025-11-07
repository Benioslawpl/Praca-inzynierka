import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import LogsClient from "./LogsClient";

const SECRET = process.env.JWT_SECRET || "Test123!";

export default async function HistoriaPage() {
  const token = cookies().get("token")?.value || "";
  let isAdmin = false;
  try {
    const payload = jwt.verify(token, SECRET);
    isAdmin = payload.role === "admin" || payload.username === "admin";
  } catch {}

  if (!isAdmin) {
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