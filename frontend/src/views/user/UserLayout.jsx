import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Heart, Calendar, LogOut, Menu, X, User, Settings, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/views/Dashboards.css';
import logo from '../../../logo/Occupra logo.png';

export default function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, user, loading } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
    { name: 'My Bookings', href: '/user/bookings', icon: Calendar },
    { name: 'Saved Homes', href: '/user/saved', icon: Heart },
    { name: 'Settings', href: '/user/settings', icon: Settings },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user || user.role !== 'user') {
    return <Navigate to="/" replace />;
  }

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
          <Link to="/" className="flex-row gap-3">
            <img src={logo} alt="Occupra" className="logo-sidebar-compact" />
            <div className="flex-col">
              <span className="text-sm font-black text-main tracking-tighter">OCCUPRA</span>
              <span className="text-[9px] font-bold text-low uppercase tracking-[0.1em]">Tenant Portal</span>
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
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-xs font-bold text-main truncate">{user?.name || 'Verified User'}</p>
               <p className="text-[9px] font-extrabold text-low uppercase tracking-[0.05em]">Standard Tier</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary !h-9 !text-[10px] !text-error !justify-start w-full"
          >
            <LogOut size={12} />
            END SESSION
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
                 <span className="text-[10px] font-bold text-low uppercase tracking-[0.1em]">Identity Verified</span>
              </div>
           </div>
           
           <div className="flex-row gap-4">
              <Link to="/" className="text-xs font-bold text-muted hover:text-primary transition-colors">
                Public Site
              </Link>
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
