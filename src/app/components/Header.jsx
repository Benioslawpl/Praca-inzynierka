"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header({ user: userProp }) {
  const pathname = usePathname();
  const [user, setUser] = useState(userProp ?? null);

  useEffect(() => {
    setUser(userProp ?? null);
  }, [userProp]);

  if (pathname === "/login") return null;

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
        <Link href="/pages/sprzet">Sprzet</Link>
        {user?.role === "admin" && <Link href="/uzytkownicy">Uzytkownicy</Link>}
        {user?.role === "admin" && <Link href="/historia">Historia</Link>}
      </div>

      <div className="menu">
        <span>
          Uzytkownik: <b>{user?.username ?? "Gosc"}</b>
        </span>
        <button onClick={handleLogout} className="logout-btn">
          Wyloguj
        </button>
      </div>
    </header>
  );
}
