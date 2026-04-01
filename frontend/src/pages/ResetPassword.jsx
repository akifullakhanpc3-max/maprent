import { useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setMessage('Password updated. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password. The link may have expired.');
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
              <span className="auth-brand-text">MapRent</span>
           </Link>
           <div className="flex-col gap-1">
             <h1 className="auth-title">New Password</h1>
             <p className="auth-subtitle">Secure your account with a new key</p>
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
                <label className="label-base">New Password</label>
                <div className="input-with-icon">
                  <KeyRound className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"} required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base auth-input"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label-base">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"} required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-base auth-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn btn-primary auth-btn h-11"
              >
                {loading ? <LoadingSpinner size="small" /> : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="flex-col items-center text-center gap-6 py-4 animate-scale-in">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex-center border border-emerald-100 text-emerald-500">
                <CheckCircle2 size={28} />
              </div>
              <div className="flex-col gap-2">
                <h3 className="text-xl font-bold text-slate-900">Success!</h3>
                <p className="text-sm font-medium text-slate-500">{message}</p>
              </div>
              <Link to="/login" className="btn btn-primary w-full !h-10 text-xs">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
