import { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, MessageSquare, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import LoadingSpinner from './common/LoadingSpinner';
import '../styles/components/BookingFormModal.css';

export default function BookingFormModal({ isOpen, onClose, propertyId, propertyTitle }) {
  const { createBooking } = useBookingStore();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    moveInDate: '',
    duration: 11, 
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await createBooking({ ...formData, propertyId });
      setSuccess('Your application has been received.');
      setTimeout(() => {
        onClose();
        setSuccess('');
        setFormData({ name: '', phone: '', moveInDate: '', duration: 11, message: '' });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Unable to submit application.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="glass-backdrop" onClick={onClose} />
      <div className="modal-overlay-container">
        <div className="modal-content-standard animate-fade-in animate-scale-in">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-stack">
            <h3 className="modal-title">Property Application</h3>
            <div className="modal-subtitle-pill" title={propertyTitle}>
               <span>Context: {propertyTitle}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost !p-2">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body custom-scrollbar">
          {error && (
             <div className="modal-status-box error animate-fade-in">
               <AlertCircle size={14} /> <span>{error}</span>
             </div>
          )}
          
          {success ? (
             <div className="modal-success-pane animate-fade-in">
               <div className="success-icon-ring">
                  <ShieldCheck size={28} />
               </div>
               <h4 className="success-heading">Application Sent</h4>
               <p className="success-message">{success}</p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="modal-form-stack">
              <div className="form-grid">
                <div className="form-field">
                  <label className="label-base">Full Name</label>
                  <div className="input-with-icon">
                    <User size={14} className="input-icon" />
                    <input 
                      type="text" name="name" required 
                      value={formData.name} onChange={handleChange} 
                      className="input-base !pl-10" 
                      placeholder="Enter your name" 
                    />
                  </div>
                </div>
                
                <div className="form-field">
                  <label className="label-base">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={14} className="input-icon" />
                    <input 
                      type="tel" name="phone" required 
                      value={formData.phone} onChange={handleChange} 
                      className="input-base !pl-10" 
                      placeholder="+91" 
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="label-base">Move-in Date</label>
                  <div className="input-with-icon">
                    <Calendar size={14} className="input-icon" />
                    <input 
                      type="date" name="moveInDate" required 
                      value={formData.moveInDate} onChange={handleChange} 
                      className="input-base !pl-10" 
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="label-base">Lease Length</label>
                  <div className="input-with-icon">
                    <Clock size={14} className="input-icon" />
                    <input 
                      type="number" name="duration" required min="1" 
                      value={formData.duration} onChange={handleChange} 
                      className="input-base !pl-10" 
                      placeholder="Months" 
                    />
                  </div>
                </div>

                <div className="form-field full-width">
                  <label className="label-base">Additional Note</label>
                  <textarea 
                    name="message" rows="3" 
                    value={formData.message} onChange={handleChange} 
                    className="input-base resize-none !h-auto !py-3" 
                    placeholder="Short message to the owner..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="submit" disabled={loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? <LoadingSpinner size="small" /> : 'Submit Application'}
                </button>
                <div className="modal-trust-tag">
                  <ShieldCheck size={12} />
                  <span>Secure Submission</span>
                </div>
              </div>
          </form>
        )}
      </div>
    </div>
  </div>
  </>
);
}
