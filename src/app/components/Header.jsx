import Link from "next/link";


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
export default Header