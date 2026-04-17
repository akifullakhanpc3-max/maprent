import { useEffect, useState } from 'react';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BASE_URL } from '../../api/axios';
import { MapPin, Calendar, CheckCircle2, XCircle, Clock, Search, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from '../../components/ImageWithSkeleton';
import ConfirmationModal from '../../components/ConfirmationModal';
import '../../styles/views/Dashboards.css';

export default function MyBookings() {
  const { myRequests, fetchMyRequests, updateBookingStatus, loading, setProcessing } = useBookingStore();
  const { user } = useAuthStore();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleCancel = async (id) => {
    setConfirmModal({ isOpen: false, id: null });
    setProcessing({ loading: true, message: 'Withdrawing application...' });

    try {
      await updateBookingStatus(id, 'cancelled');
      setProcessing({ loading: false, success: true, message: 'Application withdrawn.' });
    } catch (err) {
      setProcessing({ loading: false, error: err.response?.data?.msg || 'Failed to update status' });
    }
  };

  return (
    <div className="flex-col gap-8 animate-fade-in">
      <div className="flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="page-subtitle">Track your property requests and rental status.</p>
      </div>

      {loading ? (
        <div className="flex-col gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="console-card h-40 bg-slate-50 border-slate-100" />
          ))}
        </div>
      ) : myRequests.length === 0 ? (
        <div className="console-card flex-center flex-col py-24 border-dashed border-2 border-slate-200 !bg-slate-50/50">
          <div className="w-16 h-16 bg-white rounded-2xl flex-center mb-6 border border-slate-100 shadow-sm text-slate-200">
             <Search size={32} />
          </div>
          <div className="flex-col gap-2 items-center text-center">
            <h3 className="text-xl font-bold text-slate-900">No applications</h3>
            <p className="text-sm font-medium text-slate-500">You haven't initiated any property requests yet.</p>
          </div>
          <Link to="/" className="btn btn-primary mt-8 !px-10">
            Explore Properties
          </Link>
        </div>
      ) : (
        <div className="flex-col gap-6 animate-slide-up">
          {myRequests.map((booking, idx) => (
            <div
              key={booking._id}
              className="console-card flex flex-col md:flex-row gap-6 !p-4 hover:!bg-slate-50/50 transition-colors"
            >
              <div className="w-full md:w-48 h-40 md:h-32 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                {booking.propertyId?.images?.length > 0 ? (
                  <ImageWithSkeleton
                    src={booking.propertyId.images[0].startsWith('http') ? booking.propertyId.images[0] : `${BASE_URL}${booking.propertyId.images[0]}`}
                    alt={booking.propertyId.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex-center h-full text-slate-200"><Calendar size={28} /></div>
                )}
              </div>

              <div className="flex-1 flex-col justify-between py-1">
                <div>
                  <div className="flex-between mb-3">
                    <h3 className="text-base font-bold text-slate-900 truncate max-w-full md:max-w-[70%] text-center md:text-left">{booking.propertyId?.title || 'Inactive Property'}</h3>
                    <span className={`status-pill ${
                      booking.status === 'pending' ? 'info' :
                      booking.status === 'accepted' ? 'success' :
                      booking.status === 'rejected' ? 'error' :
                      ''
                    } uppercase !text-[9px] font-bold tracking-wider`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="flex-between items-center mb-4">
                     <p className="text-indigo-600 font-bold text-lg">{booking.propertyId?.price ? '₹' + booking.propertyId.price.toLocaleString() : 'Price N/A'} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ month</span></p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5"><MapPin size={12} className="text-indigo-400" /> {booking.propertyId?.city || 'Bengaluru'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 flex-col gap-1">
                      <span className="label-base !m-0 !text-[8px] !text-slate-400">Move-in Date</span>
                      <span className="text-xs font-bold text-slate-700">{new Date(booking.moveInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 flex-col gap-1">
                      <span className="label-base !m-0 !text-[8px] !text-slate-400">Lease term</span>
                      <span className="text-xs font-bold text-slate-700">{booking.duration} Months</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex-between pt-4 border-t border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Applied on {new Date(booking.createdAt).toLocaleDateString('en-GB')}</span>
                  {['pending', 'accepted'].includes(booking.status) && (
                    <button
                      onClick={() => setConfirmModal({ isOpen: true, id: booking._id })}
                      className="btn btn-ghost !text-rose-500 !p-0 !h-auto flex items-center gap-1.5 hover:!bg-transparent"
                    >
                      <Trash2 size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Withdraw</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => handleCancel(confirmModal.id)}
        title="Withdraw Request?"
        message="Are you sure you want to cancel this application? This action will notify the property owner."
        confirmText="Withdraw"
        type="danger"
      />
    </div>
  );
}
