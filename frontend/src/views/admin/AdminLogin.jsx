import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import '../../styles/pages/Auth.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Standardize to centralized userAuthStore for consistent headers
      await login(formData.email.trim(), formData.password);
      
      const { user } = useAuthStore.getState();
      if (user.role !== 'admin' && user.role !== 'master_admin') {
         throw new Error('Secondary administrative credentials required for access.');
      }

      window.location.href = '/admin/dashboard';
      
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">
        <header className="auth-header">
           <div className="auth-brand">
              <ShieldAlert size={20} className="text-secondary-color" />
              <span className="auth-brand-text">Platform Security</span>
           </div>
           <div className="flex-col gap-2 items-center">
             <h1 className="auth-title">Admin Access</h1>
             <p className="auth-subtitle">Encrypted console authentication required.</p>
           </div>
        </header>

        <div className="auth-card">
          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="label-base !m-0 !text-[10px] !text-slate-400">Security Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  type="email" 
                  required
                  className="input-base auth-input"
                  placeholder="master_admin@occupra.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-header-row">
                <label className="label-base !m-0 !text-[10px] !text-slate-400">Passkey</label>
              </div>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type="password" 
                  required
                  className="input-base auth-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit" 
              disabled={loading}
              className="btn btn-primary auth-btn !py-3.5 !bg-slate-900 border-none hover:!bg-black"
            >
              <KeyRound size={16} className="mr-2" />
              {loading ? 'Authenticating...' : 'Authenticate Console'}
            </button>
          </form>
          
          <div className="auth-footer">
            <Link to="/" className="auth-footer-text !text-slate-400 hover:!text-indigo-600 transition-colors inline-flex items-center gap-2">
              <ArrowLeft size={12} /> Return to discovery engine
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
