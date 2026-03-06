import { NavLink, useNavigate } from "react-router-dom";
import "./navbar.css";

const links = [
  { to: "/home", label: "Home" },
  { to: "/orders", label: "Orders" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login", { replace: true });
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/home" className="site-logo">
          Personal Shop
        </NavLink>

        <nav className="site-nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `site-nav-link${isActive ? " active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-auth-links">
          <button type="button" className="site-auth-link filled" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
