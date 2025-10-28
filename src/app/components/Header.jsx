/*import Link from "next/link";


const Header = () => {
    return(
        <header className="header">
          <div className="menu">
            
             <Link href="/"> Home</Link>
           
          </div>

          <div className="menu">
            <Link href="/pages/maszyny"> Maszyny</Link>
            <Link href="/pages/brygady">Brygady</Link>
            <Link href="/pages/sprzet">Sprzęt</Link>
            <Link href="/pages/login"> Login</Link>
          </div>
        </header>
    )
}
export default Header*/

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="header">
      <div className="menu">
        <Link href="/">Home</Link>
        <Link href="/pages/maszyny">Maszyny</Link>
        <Link href="/pages/brygady">Brygady</Link>
        <Link href="/pages/sprzet">Sprzęt</Link>
      </div>

      <div className="menu">
        {user ? (
          <>
            <span>Zalogowany jako <b>{user.username}</b></span>
            <button onClick={handleLogout} className="logout-btn">Wyloguj</button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>

      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          background: #222;
          color: #fff;
        }
        .menu {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        a {
          color: #fff;
          text-decoration: none;
        }
        .logout-btn {
          background: #d33;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </header>
  );
}
