"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header({ user: userProp }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(userProp ?? null);

  // ukryj header tylko na stronie logowania
  if (pathname === "/login") return null;

  // zawsze dociągnij usera z serwera (HttpOnly cookie -> tylko backend to widzi)
  useEffect(() => {
  (async () => {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (data?.ok) setUser(data);
    else setUser(null);
  })();
}, [pathname]);

 const handleLogout = async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.replace("/login");
  }
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
          👤 <b>{user?.username ?? "Gość"}</b>
        </span>
        <button onClick={handleLogout} className="logout-btn">
          Wyloguj
        </button>
      </div>
    </header>
  );
}