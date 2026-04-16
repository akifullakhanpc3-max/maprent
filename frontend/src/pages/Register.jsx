import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { User, Home, Mail, Lock, UserPlus, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';
import logo from '../../logo/Occupra logo.png';


export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Registration failed. Please check your details.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">

        <div className="auth-header">
          <Link to="/" className="auth-brand">
            {logo ? <img src={logo} alt="Occupra" className="logo-auth-hero" /> :
              <span className="auth-brand-text">Occupra</span>}
          </Link>
          <div className="flex-col gap-1">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join the platform to manage your rentals</p>
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

            {/* ROLE SELECTOR */}
            <div className="form-group">
              <label className="label-base">Account Type</label>
              <div className="role-selector">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`role-btn ${role === 'user' ? 'active' : ''}`}
                >
                  <div className="role-icon-box">
                    <User size={20} />
                  </div>
                  <span className="role-title">Tenant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`role-btn ${role === 'owner' ? 'active' : ''}`}
                >
                  <div className="role-icon-box">
                    <Home size={20} />
                  </div>
                  <span className="role-title">Owner</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="label-base">Full Name</label>
              <div className="input-with-icon">
                <UserPlus className="input-icon" />
                <input
                  type="text" required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base auth-input"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="label-base">Password</label>
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
                <>Create Account <ArrowRight size={16} className="ml-2" /></>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
