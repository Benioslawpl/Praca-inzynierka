"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BASE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pages/maszyny", label: "Maszyny" },
  { href: "/pages/brygady", label: "Brygady" },
  { href: "/pages/sprzet", label: "Sprzęt" },
];

const ADMIN_LINKS = [
  { href: "/uzytkownicy", label: "Użytkownicy" },
  { href: "/historia", label: "Historia" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

  const links = user?.role === "admin" ? [...BASE_LINKS, ...ADMIN_LINKS] : BASE_LINKS;

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
        <div className="brandBlock">
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
          <div className="brandText">
            <strong>Panel firmy</strong>
            <span>Zarządzanie sprzętem i brygadami</span>
          </div>
        </div>

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
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? "activeNavLink" : ""}
          >
            {link.label}
          </Link>
        ))}
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
