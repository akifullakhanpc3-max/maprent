import { useEffect, useState, Fragment } from 'react';
import { Trash2, Calendar, ShieldAlert, User, Home, Clock, AlertCircle, XCircle } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { useAuthStore } from '../../store/useAuthStore';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/views/Dashboards.css';

export default function AdminBookings() {
  const { bookings, fetchBookings, deleteBooking, updateBookingStatus, loading, error, setProcessing } = useAdminStore();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, title: '', status: null });

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (id, status) => {
    setConfirmModal({ isOpen: false, id: null, title: '', status: null });
    setProcessing({ loading: true, message: 'Updating booking status...' });
    
    try {
      if (status === 'deleted') {
        await deleteBooking(id);
        setProcessing({ loading: false, success: true, message: 'Record permanently removed.' });
      } else {
        await updateBookingStatus(id, status);
        setProcessing({ loading: false, success: true, message: `Status updated to ${status}.` });
      }
    } catch (err) {
      setProcessing({ loading: false, error: 'Operation failed.' });
    }
  };

  if (loading) return (
     <div className="flex-col gap-8 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="table-wrapper !border-slate-100">
           <div className="h-12 bg-slate-50 border-b border-slate-100" />
           <div className="p-8 space-y-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-12 items-center">
                  <div className="h-4 bg-slate-50 rounded w-1/4" />
                  <div className="h-4 bg-slate-50 rounded w-1/3" />
                  <div className="h-4 bg-slate-50 rounded w-1/6 ml-auto" />
                </div>
              ))}
           </div>
        </div>
     </div>
  );

  if (error) return (
     <div className="console-card flex-col items-center text-center gap-6 !bg-rose-50 border-rose-100 !p-12">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex-center text-rose-500 border border-rose-100">
          <AlertCircle size={32} />
        </div>
        <div className="flex-col gap-2">
          <h3 className="text-xl font-bold text-rose-900">Access Restricted</h3>
          <p className="status-pill error">{error}</p>
        </div>
     </div>
  );

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* Header Panel */}
      <div className="console-card flex-between items-center !p-4 md:!p-8 gap-4 flex-col md:flex-row">
        <div className="flex-col gap-1 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
             System Bookings
          </h2>
          <p className="page-subtitle">Monitoring property occupancy and platform transactions.</p>
        </div>
        <div className="status-pill info !px-6 !py-2 uppercase font-bold tracking-widest text-[9px] md:text-[10px]">
          {bookings.length} Records
        </div>
      </div>
      
      {/* Bookings Table */}
      <div className="table-wrapper animate-slide-up">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Involved Parties</th>
                <th>Status / History</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:!bg-slate-50/50">
                  <td>
                    <div 
                      className="flex-col gap-1 cursor-pointer group"
                      onClick={() => window.open(`/property/${booking.propertyId?._id}`, '_blank')}
                    >
                       <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] flex items-center gap-1.5 group-hover:text-primary transition-colors">
                          <Home size={14} className="text-indigo-600" />
                          {booking.propertyId?.title || 'Inactive Asset'}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">REF: {booking.propertyId?._id?.substring(0,8) || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-12">
                       <div className="min-w-0 flex-col gap-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">Tenant</p>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{booking.userId?.name || booking.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{booking.phone}</p>
                       </div>
                       <div className="min-w-0 flex-col gap-0.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Property Owner</p>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{booking.ownerId?.name || 'External'}</p>
                          <p className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]">{booking.ownerId?.email}</p>
                       </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex-col gap-2">
                      <span className={`status-pill ${
                        booking.status === 'accepted' ? 'success' :
                        booking.status === 'pending' ? 'warning' :
                        'error'
                      } !px-3 !py-1 text-[10px] uppercase font-bold`}>
                        {booking.status}
                      </span>
                      <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight"><Clock size={10} /> {new Date(booking.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                       {booking.status === 'pending' && (
                         <>
                           <button
                             onClick={() => setConfirmModal({ isOpen: true, id: booking._id, title: booking.propertyId?.title || 'this request', status: 'accepted' })}
                             className="w-8 h-8 rounded-lg flex-center bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                             title="Approve Request"
                           >
                            <Calendar size={14} />
                          </button>
                          <button
                             onClick={() => setConfirmModal({ isOpen: true, id: booking._id, title: booking.propertyId?.title || 'this request', status: 'rejected' })}
                             className="w-8 h-8 rounded-lg flex-center bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                             title="Reject Request"
                           >
                            <XCircle size={14} />
                          </button>
                         </>
                       )}
                       <button
                         onClick={() => setConfirmModal({ isOpen: true, id: booking._id, title: booking.propertyId?.title || 'this record', status: 'deleted' })}
                         className="w-8 h-8 rounded-lg flex-center bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                         title="Purge Record"
                       >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="4" className="!p-20 text-center">
                    <div className="flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex-center text-slate-200">
                        <Calendar size={32} />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No booking records established</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, title: '', status: null })}
        onConfirm={() => handleStatusUpdate(confirmModal.id, confirmModal.status)}
        title={
          confirmModal.status === 'deleted' ? 'Purge Booking Record?' : 
          confirmModal.status === 'accepted' ? 'Approve Application?' : 
          'Reject Application?'
        }
        message={
          confirmModal.status === 'deleted' 
            ? `Confirming permanent deletion of entry for: ${confirmModal.title}. This operation is irreversible.`
            : `Are you sure you want to update the status of ${confirmModal.title} to ${confirmModal.status}?`
        }
        confirmText={
          confirmModal.status === 'deleted' ? 'Confirm Purge' : 
          confirmModal.status === 'accepted' ? 'Confirm Approval' : 
          'Confirm Rejection'
        }
        type={confirmModal.status === 'deleted' || confirmModal.status === 'rejected' ? 'danger' : 'primary'}
      />
    </div>
  );
}
