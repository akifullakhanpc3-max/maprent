"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { usePropertyStore } from '../store/usePropertyStore';
import { LayoutDashboard, LogOut, Menu, X, Info, ChevronRight, Map } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const pathname = usePathname();
  
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

  const handleBrandClick = () => {
    try {
      const resetFilters = usePropertyStore.getState().resetFilters;
      if (resetFilters) resetFilters();
    } catch (e) {
      console.warn("resetFilters not available in store yet", e);
    }
    closeMenu();
  };

  const publicNav = [
    { name: 'Rentals', href: '/', icon: Map },
    { name: 'About', href: '/about', icon: Info },
    // { name: 'Blog', href: '/blog', icon: Info },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">

        <Link 
          href="/" 
          className="brand-link" 
          onClick={handleBrandClick}
        >
          <img 
            src="/logo/Occupra logo.png" 
            alt="Occupra" 
            className="logo-header" 
          />
        </Link>

        {/* Middle: Premium Desktop Navigation Routes */}
        <div className="hidden-mobile nav-pill-container">
          {publicNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-pill-link ${isActive ? 'active' : ''}`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>


        {/* Right: Actions */}
        <div className="nav-actions-wrapper">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href={dashboardPath}
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
            <div className="flex items-center hidden-mobile" style={{ gap: '8px' }}>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0 12px', height: '32px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', minWidth: 'auto' }}>
                Sign Up
              </Link>
              <Link href="/login" className="btn btn-ghost" style={{ padding: '0 8px', height: '32px', fontSize: '12px', whiteSpace: 'nowrap', width: 'auto', minWidth: 'auto' }}>
                Sign In
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
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
                  href={`/${user.role}/dashboard`}
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
                <Link href="/login" onClick={closeMenu} className="btn btn-secondary w-full">
                  Sign In
                </Link>
                <Link href="/register" onClick={closeMenu} className="btn btn-primary w-full">
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
