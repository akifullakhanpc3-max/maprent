"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Home, Calendar, LogOut, ShieldAlert, Activity, Globe, Menu, X, Settings, UserCog, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, loading } = useAuthStore();

  const ADMIN_ROLES = ['admin', 'master_admin', 'employee', 'worker'];
  const perms = user?.permissions || [];
  const isMaster = user?.role === 'master_admin';

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Users', href: '/admin/users', icon: Users, show: isMaster || perms.includes('MANAGE_USERS') },
    { name: 'Properties', href: '/admin/properties', icon: Home, show: true },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar, show: isMaster || perms.includes('MANAGE_BOOKINGS') },
    { name: 'Blogs CMS', href: '/admin/blogs', icon: BookOpen, show: true },
    ...(isMaster ? [
      { name: 'Tenants', href: '/admin/tenants', icon: Globe, show: true },
      { name: 'Staff Management', href: '/admin/staff', icon: UserCog, show: true },
    ] : []),
    { name: 'Activity Logs', href: '/admin/logs', icon: Activity, show: isMaster || perms.includes('VIEW_ANALYTICS') },
    { name: 'Security', href: '/admin/passwords', icon: ShieldAlert, show: isMaster || perms.includes('MANAGE_USERS') },
    { name: 'Settings', href: '/admin/settings', icon: Settings, show: true },
  ].filter(item => item.show);

  useEffect(() => {
    if (!loading && (!user || !ADMIN_ROLES.includes(user.role)) && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [user, loading, router, pathname]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isLoginPage = pathname === '/admin/login';

  if (loading) return <LoadingSpinner fullScreen />;

  if (isLoginPage) return children;

  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

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
              <span className="brand-name text-white">ADMIN</span>
              <span className="label-base !text-[8px] !m-0 !tracking-[0.2em] text-slate-500">Infrastructure</span>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="visible-mobile text-slate-400">
             <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
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
            <div className="w-9 h-9 flex-center rounded-md text-white font-bold text-sm" style={{background: 'var(--primary-color)'}}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-white text-xs font-bold truncate">{user?.name || 'Administrator'}</p>
               <p className="label-base !text-[8px] !m-0 truncate text-slate-500">
                 {user.role === 'master_admin' ? 'Master Protocol' : user.role === 'admin' ? 'Systems Admin' : user.role === 'employee' ? 'Employee' : 'Worker'}
               </p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="btn btn-ghost w-full !h-8 !text-[10px] !text-rose-400 border border-rose-500/10 hover:bg-rose-500/10"
          >
            <LogOut size={12} />
            GLOBAL LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-container">
        <header className="dashboard-header">
           <div className="flex-row gap-4">
              <button onClick={toggleSidebar} className="visible-mobile btn btn-secondary !p-2">
                <Menu size={20} />
              </button>
              <div className="flex-row gap-2">
                 <div className="w-2 h-2 rounded-full bg-success-color animate-pulse" />
                 <p className="label-base !m-0 text-slate-400">Node: Operational</p>
              </div>
           </div>
           
           <div className="flex-row gap-4">
              <Link href="/" className="label-base hover:text-primary-color transition-colors">
                Exit Console
              </Link>
              <div className="h-4 w-px bg-border-light" />
              <Link href="/admin/settings" className="btn btn-secondary !p-2 !h-9 !w-9 flex items-center justify-center">
                <Settings size={16} />
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
