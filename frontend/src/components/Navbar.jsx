import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Map, LayoutDashboard, LogOut, Menu, X, Info, ChevronRight } from 'lucide-react';
import MapSearchBar from './MapSearchBar';
import '../styles/components/Navbar.css';
import logo from '../../logo/Occupra logo.png';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const adminRoles = ['master_admin', 'admin', 'employee', 'worker'];
  const dashboardPath = user && adminRoles.includes(user.role) ? '/admin/dashboard' : `/${user?.role}/dashboard`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'unset';
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'unset';
  };

  const publicNav = [
    { name: 'Rentals', href: '/', icon: Map },
    { name: 'About', href: '/about', icon: Info },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">

        {/* Left: Brand */}
        <Link to="/" className="brand-link" onClick={closeMenu}>
          {logo ? <img src={logo} alt="Occupra" className="logo-header" /> :
            <span className="auth-brand-text">Occupra</span>}
          {/* <span className="brand-tagline hidden-mobile">Find your perfect space, your way.</span> */}
        </Link>


        {/* Right: Actions */}
        <div className="nav-actions-wrapper">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to={dashboardPath}
                className="btn btn-secondary !h-9 !px-4"
              >
                <LayoutDashboard size={14} />
                <span className="hidden-mobile" style={{ marginLeft: '8px' }}>Dashboard</span>
              </Link>
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="btn btn-ghost !p-2 !h-9 !w-9"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 hidden-mobile">
              <Link to="/login" className="btn btn-ghost !px-4 !h-9">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary !px-5 !h-9">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            onClick={toggleMenu}
            className="mobile-menu-toggle visible-mobile"
            aria-label="Toggle Navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-overlay ${isMenuOpen ? 'visible' : ''}`}>
        <div className="mobile-menu-pane">
          <div className="mobile-menu-header">
            <span className="mobile-menu-title">Explore</span>
            <button onClick={closeMenu} className="btn btn-ghost !p-2 !h-9 !w-9" aria-label="Close Menu">
              <X size={20} />
            </button>
          </div>

          <div className="mobile-nav-list">
            {publicNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMenu}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} className="mobile-nav-icon" />
                  <span className="mobile-nav-text">{item.name}</span>
                  <ChevronRight size={14} />
                </Link>
              );
            })}
          </div>

          <div className="mobile-menu-footer">
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-2">
                <Link
                  to={`/${user.role}/dashboard`}
                  onClick={closeMenu}
                  className="btn btn-primary w-full"
                >
                  Enter Dashboard
                </Link>
                <button
                  onClick={() => { logout(); closeMenu(); }}
                  className="btn btn-ghost w-full"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={closeMenu} className="btn btn-secondary w-full">
                  Sign In
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn btn-primary w-full">
                  Join Platform
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
