import Link from "next/link";


const Header = () => {
    return(
        <header className="header">
          <nav>
            <ul className="menu">
              <li><Link href="/">🏠 Home</Link></li>
              <li><Link href="/machines">🚜 Maszyny</Link></li>
              <li><Link href="/Brygady">Brygady</Link></li>
              <li><Link href="/Sprzet">Sprzęt</Link></li>
              <li><Link href="/login">🔑 Login</Link></li>
            </ul>
          </nav>
        </header>
    )
}
export default Header