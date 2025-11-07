import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { cookies } from "next/headers";
import { getUserFromCookie } from "../lib/auth";

export const metadata = {
  title: "Aplikacja Maszyny",
  description: "Next.js + Supabase demo",
};

export default async function RootLayout({ children }) {
  const cookieStore = cookies();
  const user = getUserFromCookies(cookieStore);

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

