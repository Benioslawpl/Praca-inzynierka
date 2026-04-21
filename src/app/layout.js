import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getUserFromCookies } from "../lib/auth";

export const metadata = {
  title: "Aplikacja Maszyny",
  description: "Next.js + Supabase demo",
};

export default async function RootLayout({ children }) {
  const user = await getUserFromCookies();

  return (
    <html lang="pl">
      <body>
        <Header user={user} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

