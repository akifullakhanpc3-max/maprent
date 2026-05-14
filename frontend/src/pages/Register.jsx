import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { User, Home, AlertCircle, Phone, Mail, Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';
import logo from '../../logo/Occupra logo.png';

// Firebase imports
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from "firebase/auth";

export default function Register() {
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: '#ef4444' });

  const { firebaseAuth, register, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    calculateStrength(formData.password);
  }, [formData.password]);

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const calculateStrength = (pass) => {
    if (!pass) {
      setPasswordStrength({ score: 0, label: 'Empty', color: '#e5e7eb' });
      return;
    }

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    let label = 'Weak';
    let color = '#ef4444';

    if (score === 2) {
      label = 'Fair';
      color = '#f59e0b';
    } else if (score === 3) {
      label = 'Good';
      color = '#10b981';
    } else if (score === 4) {
      label = 'Strong';
      color = '#059669';
    }

    setPasswordStrength({ score, label, color });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.phone || !formData.password) {
      setError('Name, Phone and Password are required.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role
      });
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      await firebaseAuth(idToken, role);
      const userRole = useAuthStore.getState().user?.role || role;
      navigate(`/${userRole}/dashboard`);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Registration cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to sign up with Google.');
      }
    } finally {
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
            <p className="auth-subtitle">Join Occupra today</p>
          </div>
        </div>

        <div className="auth-card">
          <form className="auth-form" onSubmit={handleRegister}>
            {error && (
              <div className="auth-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* ROLE SELECTOR */}
            <div className="form-group">
              <label className="label-base">I am a</label>
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
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="input-base auth-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <Phone className="input-icon" size={20} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (Required)"
                  className="input-base auth-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address (Optional)"
                  className="input-base auth-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Password (Min 8 chars)"
                  className="input-base auth-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {formData.password && (
                <div className="password-strength-container">
                  <div className="strength-meter">
                    <div 
                      className="strength-bar" 
                      style={{ 
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color 
                      }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <ShieldCheck className="input-icon" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="input-base auth-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 rounded-xl font-bold uppercase tracking-wider"
            >
              {loading ? <LoadingSpinner size="small" /> : "Sign Up"}
            </button>

            <div className="auth-divider">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="google-auth-btn"
            >
              {loading ? <LoadingSpinner size="small" /> : (
                <>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="google-logo-icon"
                  />
                  <span>Sign up with Google</span>
                </>
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
