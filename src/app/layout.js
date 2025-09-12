import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

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
          <Footer />
      </body>
    </html>
  );
}