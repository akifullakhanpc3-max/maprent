import { useAuthStore } from '../../store/useAuthStore';
import { Home, TrendingUp, PlusCircle, Calendar, Users, ArrowRight, ClipboardList, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/views/Dashboards.css';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const stats = [
    { title: 'Total Listings', value: '12', icon: Home, trend: '+2' },
    { title: 'Active Bookings', value: '4', icon: Calendar, trend: '+1' },
    { title: 'Monthly Reach', value: '1,280', icon: Users, trend: '+12%' },
  ];

  return (
    <div className="flex-col gap-10 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex-col md:flex-row flex-between items-center gap-6 text-center md:text-left">
        <div className="flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            Your property portfolio performance is <span className="text-success font-bold">Optimal</span> this period.
          </p>
        </div>
        <Link 
          to="/owner/properties" 
          className="btn btn-primary w-full md:w-auto"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Listing
        </Link>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card" style={{ '--delay': i * 1.1 }}>
              <div className="flex-between items-start">
                 <div className="w-10 h-10 rounded-lg bg-card border border-subtle flex-center text-muted">
                   <stat.icon size={20} />
                 </div>
                 <span className="status-pill success">{stat.trend}</span>
              </div>
              <div className="flex-col mt-4">
                <span className="stat-label">{stat.title}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
          </div>
        ))}
      </div>

      {/* Management Hero */}
      <div className="console-card flex-col gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-[0.03] rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
         
         <div className="flex-col md:flex-row gap-6 items-center text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl flex-center bg-card border border-subtle text-primary shadow-xl shrink-0">
               <ClipboardList size={28} />
            </div>
            <div className="flex-col gap-1">
               <h2 className="text-xl font-bold text-main">Portfolio Control Center</h2>
               <p className="text-sm text-muted">Manage your entire rental inventory and tenant relations from a single interface.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="flex-col gap-4 p-6 bg-card border border-subtle rounded-xl">
               <h3 className="text-xs font-bold text-low uppercase tracking-[0.1em]">Property Health</h3>
               <div className="flex-col gap-3">
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                     <div className="h-full bg-success w-[88%]" />
                  </div>
                  <span className="text-[10px] font-bold text-muted">88% Occupancy achieved across 12 nodes.</span>
               </div>
            </div>
            <div className="flex-col gap-4 p-6 bg-card border border-subtle rounded-xl">
               <h3 className="text-xs font-bold text-low uppercase tracking-[0.1em]">Active Signal</h3>
               <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                     {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full bg-surface border-2 border-card" />)}
                  </div>
                  <span className="text-[10px] font-bold text-muted">5 New inquiries received in last 24h.</span>
               </div>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button 
             onClick={() => navigate('/owner/properties')}
             className="btn btn-primary w-full sm:w-auto sm:!px-10"
            >
               Inventory Manager
            </button>
            <button className="btn btn-secondary w-full sm:w-auto sm:!px-8 flex-row gap-2">
               Communication Hub
               <ArrowRight size={14} className="text-low" />
            </button>
         </div>
      </div>
    </div>
  );
}
