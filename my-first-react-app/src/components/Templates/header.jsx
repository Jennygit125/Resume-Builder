import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useRouteLoaderData } from "react-router";
import { useLogout } from "../../utils/auth";
import logo from "../../assets/cheque-svgrepo-com.svg";

const navLinks = [
  { to: "/#home", label: "Home" },
  { to: "/#about", label: "About" },
  { to: "/#services", label: "Services" },
  { to: "/#contact", label: "Contact" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const logout = useLogout();

  // Access the user data defined in the root clientLoader (src/root.tsx)
  const rootData = useRouteLoaderData("root");
  const firstName = rootData?.firstName;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleAutoClose = (event) => {
      // Close if scrolling
      if (event.type === "scroll") {
        setIsMenuOpen(false);
      }
      // Close if clicking outside the header
      else if (event.type === "mousedown" && headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleAutoClose, { passive: true });
    document.addEventListener("mousedown", handleAutoClose);

    return () => {
      window.removeEventListener("scroll", handleAutoClose);
      document.removeEventListener("mousedown", handleAutoClose);
    };
  }, [isMenuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-logo">
        <Link to="/"><img src={logo} alt="Company Logo" className="logo-img" /></Link>
      </div>

      <button 
        className="mobile-toggle" 
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isMenuOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <nav className={`header-nav ${isMenuOpen ? "is-active" : ""}`}>
        <ul>
          {navLinks.map((link) => (
            <li key={link.to} className={link.isButton ? "md:ml-4" : ""}>
              <NavLink 
                to={link.to} 
                onClick={closeMenu} 
                end={link.end}
                viewTransition
                className={({ isActive }) => 
                  link.isButton ? "header-btn" : ""
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          
          <li className="md:ml-4">
            {firstName ? (
              <button 
                onClick={() => {
                  logout();
                  closeMenu();
                }} 
                className="header-btn active:scale-95 cursor-pointer w-full md:w-auto"
              >
                Logout
              </button>
            ) : (
              <NavLink to="/auth" className="header-btn active:scale-95" onClick={closeMenu}>
                Login
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
export default Header;
