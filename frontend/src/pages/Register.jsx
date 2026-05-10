import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { User, Home, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';
import logo from '../../logo/Occupra logo.png';

// Firebase imports
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from "firebase/auth";

export default function Register() {
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { firebaseAuth, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Register/Login via Firebase Auth
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
            <p className="auth-subtitle">Join the platform using your Google account</p>
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

            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className="btn btn-primary auth-btn h-12 flex items-center justify-center gap-3 w-full"
            >
              {loading ? <LoadingSpinner size="small" /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

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
