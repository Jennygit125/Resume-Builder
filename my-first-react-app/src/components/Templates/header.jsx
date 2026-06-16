import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useRouteLoaderData, useLocation } from "react-router"; // Import useLocation
import { useLogout } from "../../utils/auth.js"; // Add .js extension
import { useTheme } from "../context/ThemeContext.jsx";
import logo from "../../assets/cheque-svgrepo-com.svg";

const navLinks = [
  { to: "/#home", label: "Home", hash: "#home" },
  { to: "/#about", label: "About", hash: "#about" },
  { to: "/#services", label: "Services", hash: "#services" },
  { to: "/#contact", label: "Contact", hash: "#contact" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const logout = useLogout();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation(); // Get the current location object

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
            <li key={link.to}>
              <NavLink 
                to={link.to} 
                onClick={closeMenu} 
                viewTransition
                className={() => {
                  // For hash links, check if the current location's hash matches the link's hash
                  // We ignore NavLink's `isActive` for hash links as it only checks pathname
                  const isHashActive = location.hash === link.hash;
                  return isHashActive ? "nav-link active" : "nav-link";
                }}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          
          <li className="md:ml-4 flex items-center justify-center">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-brand-blue transition-colors cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </li>

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
