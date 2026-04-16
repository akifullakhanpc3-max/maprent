import { useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [debugToken, setDebugToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage('Recovery link sent to your email.');
      
      if (res.data.debug_token) {
        setDebugToken(res.data.debug_token);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to request reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">
        
        <div className="auth-header">
           <Link to="/" className="auth-brand">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span className="auth-brand-text">Occupra</span>
           </Link>
           <div className="flex-col gap-1">
             <h1 className="auth-title">Reset Password</h1>
             <p className="auth-subtitle">Enter your email to recover access</p>
           </div>
        </div>

        <div className="auth-card">
          {!message ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-group">
                <label className="label-base">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" />
                  <input
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base auth-input"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn btn-primary auth-btn h-11"
              >
                {loading ? <LoadingSpinner size="small" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="flex-col items-center text-center gap-6 py-4 animate-scale-in">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex-center border border-emerald-100 text-emerald-500">
                <CheckCircle2 size={28} />
              </div>
              <div className="flex-col gap-2">
                <h3 className="text-xl font-bold text-slate-900">Link Sent</h3>
                <p className="text-sm font-medium text-slate-500">{message}</p>
              </div>

              {debugToken && (
                <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-100 flex-col gap-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Development Bypass</p>
                    <Link 
                      to={`/reset-password/${debugToken}`}
                      className="btn btn-primary !h-10 text-xs w-full"
                    >
                      Bypass Security
                    </Link>
                </div>
              )}
            </div>
          )}

          <div className="auth-footer">
            <Link to="/login" className="flex-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
