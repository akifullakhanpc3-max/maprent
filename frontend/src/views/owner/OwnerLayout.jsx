import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Home, Calendar, LogOut, Menu, X, PlusCircle, Settings, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/views/Dashboards.css';

export default function OwnerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, user, loading } = useAuthStore();

  const navigation = [
    { name: 'Overview', href: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'My Properties', href: '/owner/properties', icon: Home },
    { name: 'Add Property', href: '/owner/properties/new', icon: PlusCircle },
    { name: 'Manage Bookings', href: '/owner/bookings', icon: ClipboardList },
    { name: 'Availability', href: '/owner/availability', icon: Calendar },
    { name: 'Settings', href: '/owner/settings', icon: Settings },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user || user.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
        style={{ zIndex: 4500 }} /* Ensure it covers everything but sidebar */
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="flex-row gap-3">
            <div className="flex-center w-8 h-8 rounded-lg bg-primary text-white">
              <Home size={16} />
            </div>
            <div className="flex-col">
              <span className="text-sm font-black text-main tracking-tighter">MAPRENT</span>
              <span className="text-[9px] font-bold text-low uppercase tracking-[0.1em]">Owner Console</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="visible-mobile text-muted">
             <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
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
            onClick={logout}
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
              <Link to="/" className="text-xs font-bold text-muted hover:text-primary transition-colors">
                Public View
              </Link>
              <div className="h-4 w-px bg-border-subtle" />
              <button className="btn btn-secondary !p-0 !h-9 !w-9">
                <Settings size={16} />
              </button>
           </div>
        </header>

        <main className="main-content">
           <div className="dashboard-content-overflow">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
