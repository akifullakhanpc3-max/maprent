import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Login failed. Please check your credentials.');
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
             <h1 className="auth-title">Welcome Back</h1>
             <p className="auth-subtitle">Sign in to your account to continue</p>
           </div>
        </div>

        <div className="auth-card">
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

            <div className="form-group">
              <div className="form-header-row">
                <label className="label-base">Password</label>
                <Link to="/forgot-password" size="small" className="link-muted">
                  Forgot?
                </Link>
              </div>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base auth-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary auth-btn h-11"
            >
              {loading ? <LoadingSpinner size="small" /> : (
                <>Sign in <ArrowRight size={16} className="ml-2" /></>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?
              <Link to="/register" className="auth-link">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
