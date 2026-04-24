import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getUserFromCookies } from "../lib/auth";

export const metadata = {
  title: "Panel Zarządzania Zapleczem",
  description: "Aplikacja do zarządzania maszynami, sprzętem i brygadami.",
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

