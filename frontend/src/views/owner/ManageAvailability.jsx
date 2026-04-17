import { useEffect, useState } from 'react';
import api, { BASE_URL } from '../../api/axios';
import { Calendar, Search, MapPin, Power, Activity, ShieldCheck, AlertCircle, Home, Clock, CheckCircle2, XCircle } from 'lucide-react';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import '../../styles/views/Dashboards.css';
import '../../styles/views/ManageProperties.css';

export default function ManageAvailability() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/mine');
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const toggleAvailability = async (property) => {
    setUpdatingId(property._id);
    try {
      const newStatus = !property.isActive;
      const res = await api.put(`/properties/${property._id}`, {
        isActive: newStatus
      });
      
      // Update local state
      setProperties(properties.map(p => 
        p._id === property._id ? { ...p, isActive: newStatus } : p
      ));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = properties.filter(p => p.isActive).length;
  const inactiveCount = properties.length - activeCount;

  return (
    <div className="flex-col gap-6 animate-fade-in">
      {/* PREMIUM CONSOLE HEADER */}
      <header className="properties-header-premium !bg-slate-900 !border-none text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Activity size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6 w-full">
           <div className="flex-col gap-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex-center shadow-lg shadow-indigo-500/20">
                  <Power size={20} className="text-white" />
               </div>
               <h1 className="text-2xl font-black tracking-tighter">Availability Console</h1>
             </div>
             <p className="text-slate-400 text-sm font-medium">Instantly toggle visibility for your property portfolio</p>
           </div>

           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="px-5 py-2 flex-col items-center border-r border-white/5">
                 <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{activeCount}</span>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Live Now</span>
              </div>
              <div className="px-5 py-2 flex-col items-center">
                 <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{inactiveCount}</span>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Off-Market</span>
              </div>
           </div>
        </div>
      </header>

      {/* FILTERS & SEARCH */}
      <div className="flex-row items-center justify-between gap-4">
         <div className="search-wrapper-premium !max-w-md w-full">
           <Search className="absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-low)' }} />
           <input 
             type="text" 
             placeholder="Search by property name..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="search-input-premium"
           />
         </div>
         
         <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Secure Management Channel</span>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3].map(i => (
             <div key={i} className="console-card h-64 animate-pulse bg-slate-50" />
           ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="console-card flex-center flex-col py-32 border-dashed">
           <AlertCircle size={48} className="text-slate-200 mb-4" />
           <h3 className="text-lg font-bold text-slate-800">No properties found</h3>
           <p className="text-slate-500 text-sm">Either no assets are listed or search terms didn't match.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
           {filteredProperties.map((property) => (
             <div key={property._id} className={`console-card flex flex-col sm:flex-row gap-6 p-5 transition-all duration-500 ${!property.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                
                {/* PREVIEW IMAGE */}
                <div className="w-full sm:w-48 h-40 sm:h-32 rounded-2xl overflow-hidden relative group">
                   <ImageWithSkeleton 
                     src={property.images[0]?.startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`}
                     alt={property.title}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-3 left-3">
                      <span className={`status-pill !py-1 !px-2 !text-[8px] ${property.isActive ? 'success' : 'info'}`}>
                         {property.isActive ? 'ACTIVE' : 'DELISTED'}
                      </span>
                   </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex-col justify-between py-1">
                   <div className="flex-col gap-1">
                      <h3 className="text-base font-bold text-slate-800 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-2 text-slate-500">
                         <MapPin size={12} />
                         <span className="text-[11px] font-medium">{property.city}</span>
                      </div>
                   </div>

                   <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 flex-col">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Status</span>
                         <span className={`text-xs font-black ${property.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                            {property.isActive ? 'OPEN FOR ENQUIRIES' : 'CURRENTLY PRIVATE'}
                         </span>
                      </div>
                      
                      {/* TOGGLE SWITCH */}
                      <button 
                        onClick={() => toggleAvailability(property)}
                        disabled={updatingId === property._id}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center p-1 ${
                           property.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                        } ${updatingId === property._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-4 hover:ring-indigo-100'}`}
                      >
                         <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 flex-center ${
                            property.isActive ? 'translate-x-7' : 'translate-x-0'
                         }`}>
                            {updatingId === property._id ? (
                               <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : property.isActive ? (
                               <CheckCircle2 size={12} className="text-indigo-600" />
                            ) : (
                               <XCircle size={12} className="text-slate-400" />
                            )}
                         </div>
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* FOOTER INFO */}
      <footer className="console-card !p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-dashed bg-slate-50/50">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex-center shadow-sm border border-slate-100">
               <Clock size={16} className="text-indigo-500" />
            </div>
            <div className="flex-col">
               <span className="text-[11px] font-bold text-slate-800">Real-time Visibility Sync</span>
               <span className="text-[10px] text-slate-500">Toggling status affects public map markers instantly.</span>
            </div>
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Occupra Global Asset Registry • Secure Protocol
         </p>
      </footer>
    </div>
  );
}
