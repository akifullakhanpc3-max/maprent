import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import '../styles/components/BookingFormModal.css'; // Reusing modal layout styles

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", type = "danger" }) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="modal-overlay">
      <div className="mobile-overlay visible" onClick={onClose} />
      
      <div 
        className="modal-container animate-fade-in animate-scale-in !max-w-sm"
        style={{ position: 'relative', zIndex: 5000 }}
      >
        <div className="modal-header">
          <div className="modal-title-stack">
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle-pill">System Confirmation</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost !p-2">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="flex-row gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 mb-6">
             <div className={`w-10 h-10 flex-center rounded-xl ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                {isDanger ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
             </div>
             <p className="text-slate-500 text-sm font-medium leading-relaxed flex-1">
                {message}
             </p>
          </div>

          <div className="flex-row gap-3">
            <button 
              onClick={onConfirm} 
              className={`btn flex-1 ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose} 
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
