"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header({ user: userProp }) {
  const pathname = usePathname();
  const [user, setUser] = useState(userProp ?? null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(userProp ?? null);
  }, [userProp]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  };

  return (
    <header className="appHeader">
      <div className="appHeaderTop">
        <button
          type="button"
          className="menuToggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="menu appUserBar appUserBarMobile">
          <span className="userBadge">
            Konto: <b>{user?.username ?? "Gość"}</b>
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Wyloguj
          </button>
        </div>
      </div>

      <nav
        id="primary-navigation"
        className={`menu appNav ${menuOpen ? "menuOpen" : ""}`}
      >
        <Link href="/">Home</Link>
        <Link href="/pages/maszyny">Maszyny</Link>
        <Link href="/pages/brygady">Brygady</Link>
        <Link href="/pages/sprzet">Sprzęt</Link>
        {user?.role === "admin" && <Link href="/uzytkownicy">Użytkownicy</Link>}
        {user?.role === "admin" && <Link href="/historia">Historia</Link>}
      </nav>

      <div className="menu appUserBar">
        <span className="userBadge">
          Konto: <b>{user?.username ?? "Gość"}</b>
        </span>
        <button onClick={handleLogout} className="logout-btn">
          Wyloguj
        </button>
      </div>
    </header>
  );
}
