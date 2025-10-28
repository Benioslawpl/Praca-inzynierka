"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  // 🔸 Nie pokazuj nagłówka na /login
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header>
      <div className="menu">
        <Link href="/">Home</Link>
        <Link href="/maszyny">Maszyny</Link>
        <Link href="/brygady">Brygady</Link>
        <Link href="/sprzet">Sprzęt</Link>
      </div>
      <div className="menu">
        {user ? (
          <>
            <span>Zalogowany: <b>{user.username}</b></span>
            <button onClick={handleLogout} className="logout-btn">Wyloguj</button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </header>
  );
}