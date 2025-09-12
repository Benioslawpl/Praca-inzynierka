import "./globals.css";
import Link from "next/link";
import Header from "./components/Header";

export const metadata = {
  title: "Aplikacja Maszyny",
  description: "Next.js + Supabase demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        {/* Nagłówek */}
          < Header/>
        {/* Główna treść */}
        <main className="main">{children}</main>

        {/* Stopka */}
        <footer className="footer">
          <p>© 2025 Moja Firma – Wszystkie prawa zastrzeżone</p>
        </footer>
      </body>
    </html>
  );
}