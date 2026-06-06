"use client";

import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, User, Home, Phone, Lock } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Navbar from '@/components/Navbar';

// Firebase imports
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const [role, setRole] = useState('user'); 
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { firebaseAuth, login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(`/${user.role}/dashboard`);
      }
    } catch (err) {
      setError(err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      await firebaseAuth(idToken, role);
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(`/${user.role}/dashboard`);
      }
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
    <>
      <Navbar />
      <div className="auth-page animate-fade-in">
        <div className="auth-container">
          <div className="auth-header">
            <Link href="/" className="auth-brand">
              <img src="/logo/Occupra logo.png" alt="Occupra" className="logo-auth-hero" />
            </Link>
            <div className="auth-header-text">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to continue</p>
            </div>
          </div>

          <div className="auth-card">
            <form className="auth-form" onSubmit={handleLogin}>
              {error && (
                <div className="auth-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* ROLE SELECTOR */}
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

              <div className="form-group">
                <div className="input-with-icon">
                  <Phone className="input-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Phone or Email"
                    className="input-base auth-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-with-icon">
                  <Lock className="input-icon" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    className="input-base auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-header-row" style={{ marginTop: '4px' }}>
                  <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '600' }}>
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-12 rounded-xl font-bold uppercase tracking-wider"
              >
                {loading ? <LoadingSpinner size="small" /> : "Sign In"}
              </button>

              <div className="auth-divider">
                <span className="divider-line"></span>
                <span className="divider-text">OR</span>
                <span className="divider-line"></span>
              </div>

              <button
                type="button"
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
            </form>

            <div className="auth-footer">
              <p className="auth-footer-text">
                Don't have an account?{" "}
                <Link href="/register" className="auth-link">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
