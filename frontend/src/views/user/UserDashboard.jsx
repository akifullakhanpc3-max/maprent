import { useAuthStore } from '../../store/useAuthStore';
import { Calendar, Map, ShieldCheck, ArrowRight, Home, Zap, ExternalLink, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/views/Dashboards.css';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="flex-col gap-10 animate-fade-in">
      
      {/* Search Hero */}
      <div className="console-card flex-col gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-[0.03] rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Rental Intelligence Portal</span>
            
            <div className="flex-col gap-2">
              <h1 className="text-4xl font-black text-main tracking-tight">
                Welcome, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-muted text-sm font-medium max-w-lg mx-auto leading-relaxed">
                Your secure gateway to verified property acquisitions. Manage applications and discover premium listings with real-time navigation.
              </p>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="btn btn-primary !px-12 shadow-2xl"
            >
              Discover Properties <ArrowRight size={16} className="ml-2" />
            </button>
         </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Booking Card */}
        <div className="console-card flex-col gap-6 group hover:border-primary hover:border-opacity-30 transition-all duration-300">
          <div className="w-12 h-12 bg-card rounded-xl flex-center text-primary border border-subtle shadow-lg group-hover:shadow-primary/5 transition-all">
            <Calendar size={24} />
          </div>
          <div className="flex-col gap-2">
            <h3 className="text-lg font-bold text-main">Active Applications</h3>
            <p className="text-muted text-xs font-medium leading-relaxed">
              Track your property search progress and owner responses through our secure signal layer.
            </p>
          </div>
          <button 
            onClick={() => navigate('/user/bookings')} 
            className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-wider hover:gap-3 transition-all"
          >
            Manage Requests <ArrowRight size={14} />
          </button>
        </div>

        {/* Explore Card */}
        <div className="console-card flex-col gap-6 group hover:border-primary hover:border-opacity-30 transition-all duration-300">
          <div className="w-12 h-12 bg-card rounded-xl flex-center text-muted border border-subtle shadow-lg group-hover:shadow-primary/5 transition-all">
            <Search size={24} />
          </div>
          <div className="flex-col gap-2">
            <h3 className="text-lg font-bold text-main">Verified Marketplace</h3>
            <p className="text-muted text-xs font-medium leading-relaxed">
              Access over 500+ premium listings verified through our multi-factor asset verification protocol.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-muted font-black text-[10px] uppercase tracking-wider hover:gap-3 transition-all"
          >
            Explore Map <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
