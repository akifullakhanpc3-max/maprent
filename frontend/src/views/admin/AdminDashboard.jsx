import { useEffect } from 'react';
import { Users, Clock, ShieldCheck, AlertCircle, Globe, Activity, Database, RefreshCw } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/views/Dashboards.css';

export default function AdminDashboard() {
  const { stats, fetchDashboard, loading, error } = useAdminStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return (
     <div className="flex-col gap-10 animate-pulse">
        <div className="h-20 bg-card rounded-xl border border-subtle" />
        <div className="stats-grid">
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-subtle" />)}
        </div>
     </div>
  );
  
  if (error) return (
    <div className="console-card flex-center flex-col gap-8 !p-16">
       <div className="w-16 h-16 rounded-2xl flex-center bg-card text-error border border-error border-opacity-20 shadow-xl">
          <AlertCircle size={32} />
       </div>
       <div className="flex-col gap-2 items-center text-center">
         <h3 className="text-xl font-bold text-main">System Link Failure</h3>
         <p className="text-sm text-muted max-w-xs">{error}</p>
       </div>
       <button onClick={() => fetchDashboard()} className="btn btn-primary !px-10">
          <RefreshCw size={16} className="mr-2" />
          Reconnect System
       </button>
    </div>
  );
  
  if (!stats) return null;

  const cards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, trend: '+12%' },
    { title: 'Total Properties', value: stats.totalProperties, icon: Globe, trend: 'Global' },
    { title: 'Pending Audit', value: stats.pendingProperties, icon: Clock, trend: 'High Priority' },
    { title: 'Verified Assets', value: stats.featuredProperties, icon: ShieldCheck, trend: 'Trusted' },
  ];

  return (
    <div className="flex-col gap-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex-col gap-2">
         <h1 className="page-title">Admin Dashboard</h1>
         <p className="page-subtitle">Monitor platform health, property moderation, and user activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {cards?.map((card, i) => (
          <div key={i} className="stat-card">
              <div className="flex-between items-start">
                <div className="w-10 h-10 rounded-lg bg-card border border-subtle flex-center text-primary">
                  <card.icon size={20} />
                </div>
                <span className="status-pill info">{card.trend}</span>
              </div>
              <div className="flex-col mt-4">
                <span className="stat-label">{card.title}</span>
                <span className="stat-value">{card.value}</span>
              </div>
          </div>
        ))}
      </div>

      {/* Admin Hero Section */}
      <div className="console-card flex-col gap-10 !p-6 md:!p-12 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-[0.03] rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex-center bg-card border border-subtle text-primary shadow-2xl">
               <Database size={28} />
            </div>
            <div className="flex-col gap-2">
              <h2 className="text-xl md:text-2xl font-black text-main tracking-tight px-4">System Integrity Panel</h2>
              <p className="text-muted text-sm font-medium max-w-xl mx-auto leading-relaxed px-4">
                 You are accessing the core administrative layer of MapRent. Maintain operational stability through real-time moderation and security oversight.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="status-pill !bg-surface !border-subtle text-muted">
                  Build v1.0.4-LTS
               </div>
               <div className="status-pill !bg-success !bg-opacity-5 !text-success !border-success !border-opacity-20 flex items-center gap-2">
                  <Activity size={10} /> System Operational
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-4 relative z-10">
            <div className="p-4 bg-card border border-subtle rounded-xl flex-col gap-2">
               <span className="text-[10px] font-bold text-low uppercase tracking-[0.1em]">Database Link</span>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-main">Connected</span>
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success-color)]" />
               </div>
            </div>
            <div className="p-4 bg-card border border-subtle rounded-xl flex-col gap-2">
               <span className="text-[10px] font-bold text-low uppercase tracking-[0.1em]">Latency</span>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-main">24ms</span>
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success-color)]" />
               </div>
            </div>
            <div className="p-4 bg-card border border-subtle rounded-xl flex-col gap-2">
               <span className="text-[10px] font-bold text-low uppercase tracking-[0.1em]">Security Layer</span>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-main">Active</span>
                  <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success-color)]" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
