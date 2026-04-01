import { CheckCircle2, Loader2, Info, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useAdminStore } from '../store/useAdminStore';
import { useEffect } from 'react';
import '../styles/components/StatusOverlay.css';

export default function StatusOverlay() {
  const bookingProc = useBookingStore(s => s.processing);
  const clearBooking = useBookingStore(s => s.clearProcessing);
  
  const adminProc = useAdminStore(s => s.processing);
  const clearAdmin = useAdminStore(s => s.clearProcessing);

  const processing = (bookingProc.loading || bookingProc.success || bookingProc.error) ? bookingProc : adminProc;
  const clearProcessing = (bookingProc.loading || bookingProc.success || bookingProc.error) ? clearBooking : clearAdmin;

  const { loading, success, error, message } = processing;

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        clearProcessing();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearProcessing]);

  if (!loading && !success && !error) return null;

  return (
    <div className="status-overlay-portal">
      <div className={`glass-backdrop active`} onClick={clearProcessing} />
      
      <div 
        className={`status-modal animate-fade-in animate-scale-in ${error ? 'is-error' : success ? 'is-success' : 'is-loading'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="status-modal-inner">
          
          {loading && (
            <div className="status-content">
              <div className="status-icon-box loading">
                 <Loader2 size={24} className="animate-spin" />
              </div>
              <div className="status-info-stack">
                <h3 className="status-heading">Processing...</h3>
                <p className="status-message">{message || 'Please wait a moment'}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="status-content">
              <div className="status-icon-box success">
                <ShieldCheck size={28} />
              </div>
              <div className="status-info-stack">
                <h3 className="status-heading">Action Successful</h3>
                <p className="status-message">{message || 'Your request has been processed.'}</p>
              </div>
              <button onClick={clearProcessing} className="btn btn-secondary w-full">Dismiss</button>
            </div>
          )}

          {error && (
            <div className="status-content">
              <div className="status-icon-box error">
                <AlertCircle size={28} />
              </div>
              <div className="status-info-stack">
                <h3 className="status-heading">Request Error</h3>
                <div className="error-display-box">
                   <p className="error-text-content">{error}</p>
                </div>
              </div>
              <button onClick={clearProcessing} className="btn btn-primary w-full">Close</button>
            </div>
          )}

        </div>
        <div className="status-modal-footer-accent" />
      </div>
    </div>
  );
}
