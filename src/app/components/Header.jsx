"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const BASE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pages/budowy", label: "Budowy" },
  { href: "/pages/maszyny", label: "Maszyny" },
  { href: "/pages/brygady", label: "Brygady" },
  { href: "/pages/sprzet", label: "Sprzęt" },
];

const ADMIN_LINKS = [
  { href: "/uzytkownicy", label: "Użytkownicy" },
  { href: "/historia", label: "Historia" },
];

const OPERATOR_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pages/maszyny", label: "Moja maszyna" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ user: userProp }) {
  const pathname = usePathname();
  const [user, setUser] = useState(userProp ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setUser(userProp ?? null);
  }, [userProp]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (currentY < 24 || menuOpen) {
        setIsVisible(true);
      } else if (delta > 8) {
        setIsVisible(false);
      } else if (delta < -8) {
        setIsVisible(true);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  if (pathname === "/login") return null;

  let links = BASE_LINKS;
  if (user?.role === "operator") {
    links = OPERATOR_LINKS;
  } else if (user?.role === "admin") {
    links = [...BASE_LINKS, ...ADMIN_LINKS];
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  };

  return (
    <header
      className={`appHeader ${isVisible ? "appHeaderVisible" : "appHeaderHidden"}`}
    >
      <div className="desktopUserBlock">
        <span className="userBadge">
          <span className="desktopUserLabel">Użytkownik</span>
          <b>{user?.username ?? "Gość"}</b>
        </span>
      </div>

      <div className="appHeaderTop">
        <span className="mobileUserName">
          <span className="mobileUserLabel">Użytkownik</span>
          <b>{user?.username ?? "Gość"}</b>
        </span>

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

        <button
          type="button"
          className="logout-btn mobileLogout"
          onClick={handleLogout}
        >
          Wyloguj
        </button>
      </nav>

      <div className="menu appUserBar">
        <button onClick={handleLogout} className="logout-btn">
          Wyloguj
        </button>
      </div>
    </header>
  );
}
