import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, User, Home } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';
import logo from '../../logo/Occupra logo.png';

// Firebase imports
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user'); // Default role for new users

  const { firebaseAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send token to our backend
      await firebaseAuth(idToken, role);
      // Retrieve updated state to get correct role-based redirect
      const userRole = useAuthStore.getState().user?.role || role;
      navigate(`/${userRole}/dashboard`);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
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
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in with your Google account to continue</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-form">
            {error && (
              <div className="auth-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* ROLE SELECTOR - Hidden if user already exists, but needed for first-time login */}
            <div className="form-group">
              <label className="label-base">Login as</label>
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

            <button
              onClick={handleGoogleLogin}
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
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

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
