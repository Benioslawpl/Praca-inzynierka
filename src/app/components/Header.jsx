"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  // ukryj header tylko na stronie logowania
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header>
      <div className="menu">
        <Link href="/">Home</Link>
        <Link href="/pages/maszyny">Maszyny</Link>
        <Link href="/pages/brygady">Brygady</Link>
        <Link href="/pages/sprzet">Sprzęt</Link>
        {user?.role === "admin" && <Link href="/uzytkownicy">Użytkownicy</Link>}
        {user?.role === "admin" && <Link href="/historia">Historia</Link>}
      </div>
      <div className="menu">
        <span>
          👤 <b>{user?.username || "Użytkownik"}</b>
        </span>
        <button onClick={handleLogout} className="logout-btn">
          Wyloguj
        </button>
      </div>
    </header>
  );
}