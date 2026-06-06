"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Home, Calendar, LogOut, Menu, X, PlusCircle, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function OwnerLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, loading } = useAuthStore();

  const navigation = [
    { name: 'Overview', href: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'My Properties', href: '/owner/properties', icon: Home },
    { name: 'Add Property', href: '/owner/properties/new', icon: PlusCircle },
    { name: 'Manage Bookings', href: '/owner/bookings', icon: ClipboardList },
    { name: 'Availability', href: '/owner/availability', icon: Calendar },
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== 'owner')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user || user.role !== 'owner') return null;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="flex-row gap-3">
            <img src="/logo/Occupra logo.png" alt="Occupra" className="logo-sidebar-compact" />
            <div className="flex-col">
              <span className="text-sm font-black text-main tracking-tighter">OCCUPRA</span>
              <span className="text-[9px] font-bold text-low uppercase tracking-[0.1em]">Owner Console</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="visible-mobile text-muted">
             <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === '/owner/properties' && pathname === '/owner/properties/new');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <div className="flex-row gap-3 mb-4">
            <div className="w-9 h-9 flex-center rounded-lg bg-primary text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-xs font-bold text-main truncate">{user?.name || 'Property Owner'}</p>
               <p className="text-[9px] font-extrabold text-low uppercase tracking-[0.05em]">Authorized Owner</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="btn btn-secondary !h-9 !text-[10px] !text-error !justify-start w-full"
          >
            <LogOut size={12} />
            SECURE LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-container">
        <header className="dashboard-header">
           <div className="flex-row gap-4">
              <button onClick={toggleSidebar} className="visible-mobile btn btn-secondary !p-2 !w-9 !h-9">
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success-color)]" />
                 <span className="text-[10px] font-bold text-low uppercase tracking-[0.1em]">System Operational</span>
              </div>
           </div>
           
           <div className="flex-row gap-4">
              <Link href="/" className="text-xs font-bold text-muted hover:text-primary transition-colors">
                Public View
              </Link>
           </div>
        </header>

        <main className="main-content">
          <div className="dashboard-content-overflow">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
