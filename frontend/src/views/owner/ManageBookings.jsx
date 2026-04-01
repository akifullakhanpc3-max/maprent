import { useEffect, useState } from 'react';
import { useBookingStore } from '../../store/useBookingStore';
import { Calendar, CheckCircle2, XCircle, Clock, Search, ShieldCheck, Mail, Phone, MessageSquare, Home, User } from 'lucide-react';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import ConfirmationModal from '../../components/ConfirmationModal';
import '../../styles/views/Dashboards.css';

export default function ManageBookings() {
  const { incomingBookings, fetchIncoming, updateBookingStatus, loading, setProcessing } = useBookingStore();
  const [filter, setFilter] = useState('all'); 
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, status: null });

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming]);

  const handleStatusUpdate = async (id, status) => {
    setConfirmModal({ isOpen: false, id: null, status: null });
    setProcessing({ loading: true, message: `Updating application...` });
    
    try {
      await updateBookingStatus(id, status);
      setProcessing({ loading: false, success: true, message: `Status updated.` });
    } catch (err) {
      setProcessing({ loading: false, error: err.response?.data?.msg || `Failed to update` });
    }
  };

  const filteredBookings = incomingBookings.filter(b => 
    filter === 'all' ? true : b.status === filter
  );

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* HEADER SECTION */}
      <div className="console-card flex flex-col md:flex-row justify-between items-center gap-6 !p-6 md:!p-8 !bg-slate-900 border-none relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Calendar size={100} className="text-white" />
         </div>
         <div className="relative z-10 flex-col gap-1 text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-white">Tenancy Requests</h1>
            <p className="text-slate-400 text-sm font-medium">Review and process incoming property applications.</p>
         </div>
         
         <div className="relative z-10 flex bg-white/5 p-1 rounded-xl border border-white/10">
            {['all', 'pending', 'accepted', 'rejected'].map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                   filter === f 
                     ? 'bg-indigo-600 text-white' 
                     : 'text-slate-400 hover:text-white'
                 }`}
               >
                 {f}
               </button>
            ))}
         </div>
      </div>

      {loading && filteredBookings.length === 0 ? (
        <div className="flex-col gap-4">
          {[1, 2].map(i => (
            <div key={i} className="console-card flex-row gap-6 animate-pulse">
               <div className="w-56 h-36 bg-slate-100 rounded-xl" />
               <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="console-card flex-center flex-col py-20 border-dashed">
           <Search size={40} className="text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-800">No requests</h3>
           <p className="text-slate-500 text-sm font-medium">There are no applications matching this filter.</p>
        </div>
      ) : (
        <div className="flex-col gap-5">
          {filteredBookings.map((booking, idx) => (
            <div 
              key={booking._id} 
              className="console-card flex flex-col md:flex-row gap-6 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              
              {/* PROPERTY PREVIEW */}
              <div className="w-full md:w-64 flex-col gap-3">
                 <div className="relative h-40 md:h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    {booking.propertyId?.images?.length > 0 ? (
                      <ImageWithSkeleton 
                        src={booking.propertyId.images[0].startsWith('http') ? booking.propertyId.images[0] : `http://localhost:5050${booking.propertyId.images[0]}`}
                        alt={booking.propertyId.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex-center h-full text-slate-300"><Home size={24} /></div>
                    )}
                 </div>
                 <div className="flex-col gap-1 text-center md:text-left">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{booking.propertyId?.title || 'Property Listing'}</h3>
                    <p className="text-indigo-600 font-bold text-sm">₹{booking.propertyId?.rent?.toLocaleString()}</p>
                 </div>
              </div>

              {/* APPLICANT INFO */}
              <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100 flex-col gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex-center shadow-sm border border-slate-100 text-indigo-600">
                       <User size={18} />
                    </div>
                    <div className="flex-col gap-0.5">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Applicant</p>
                       <p className="text-sm font-bold text-slate-900">{booking.name}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <Phone size={14} className="text-indigo-500" />
                       {booking.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <Clock size={14} className="text-amber-500" />
                       Move-in: {new Date(booking.moveInDate).toLocaleDateString()}
                    </div>
                 </div>

                 {booking.message && (
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 italic leading-relaxed">
                       "{booking.message}"
                    </div>
                 )}
              </div>

              {/* ACTIONS */}
              <div className="w-full md:w-56 flex-col justify-center gap-3 md:border-l border-t md:border-t-0 border-slate-100 pt-6 md:pt-0 md:pl-6">
                {booking.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, id: booking._id, status: 'accepted' })}
                      className="btn btn-primary w-full"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, id: booking._id, status: 'rejected' })}
                      className="btn btn-ghost w-full !text-rose-500"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <div className={`status-pill w-full text-center !py-3 ${
                    booking.status === 'accepted' ? 'success' :
                    booking.status === 'rejected' ? 'error' :
                    'info'
                  }`}>
                    {booking.status}
                  </div>
                )}
                <p className="label-base !m-0 !text-[9px] text-center">Applied {new Date(booking.createdAt).toLocaleDateString()}</p>
              </div>

            </div>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, status: null })}
        onConfirm={() => handleStatusUpdate(confirmModal.id, confirmModal.status)}
        title={confirmModal.status === 'accepted' ? "Approve Application?" : "Reject Application?"}
        message={`Are you sure you want to ${confirmModal.status} this request?`}
        confirmText={confirmModal.status === 'accepted' ? "Confirm Approval" : "Confirm Rejection"}
        type={confirmModal.status === 'accepted' ? 'primary' : 'danger'}
      />
    </div>
  );
}
