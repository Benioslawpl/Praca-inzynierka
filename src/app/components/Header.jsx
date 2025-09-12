import Link from "next/link";


const Header = () => {
    return(
        <header className="header">
          <div className="menu">
            
             <Link href="/"> Home</Link>
           
          </div>

          <div className="menu">
            <Link href="/machines"> Maszyny</Link>
            <Link href="/Brygady">Brygady</Link>
            <Link href="/Sprzet">Sprzęt</Link>
            <Link href="/login"> Login</Link>
          </div>
        </header>
    )
}
export default Header