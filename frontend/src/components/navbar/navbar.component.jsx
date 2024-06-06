import { Link } from 'react-router-dom';
import logo from "../../imgs/logo.png";
import "./navbar.css"

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/" className="logo_img">
                <img src={logo} />
            </Link>

            <div className='search-bar'>
                <input 
                    type='text'
                    placeholder='Search'
                    className='search-input'
                />

                <i className="fi fi-rr-search search-icon"></i>
            </div>
        </nav>
    )
}

export default Navbar;