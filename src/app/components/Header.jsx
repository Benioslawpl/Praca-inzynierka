import Link from "next/link";


const Header = () => {
    return(
        <header className="header">
          <div className="menu1">
            <ul>
              <li><Link href="/"> Home</Link></li>
            </ul>
          </div>

          <div className="menu2">
            <ul>
              <li><Link href="/machines"> Maszyny</Link></li>
              <li><Link href="/Brygady">Brygady</Link></li>
              <li><Link href="/Sprzet">Sprzęt</Link></li>
              <li><Link href="/login"> Login</Link></li>
            </ul>
          </div>
        </header>
    )
}
export default Header