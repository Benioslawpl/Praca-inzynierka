import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Aplikacja Maszyny",
  description: "Next.js + Supabase demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        {/* Nagłówek */}
        <header className="header">
          <nav>
            <ul className="menu">
              <li><Link href="/">🏠 Home</Link></li>
              <li><Link href="/machines">🚜 Maszyny</Link></li>
              <li><Link href="/login">🔑 Login</Link></li>
            </ul>
          </nav>
        </header>

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