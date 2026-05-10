import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages/Auth.css';
import logo from '../../logo/Occupra logo.png';

// Firebase imports
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const { otpAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier && auth) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response) => {
            // reCAPTCHA solved
          }
        });
      } catch (err) {
        console.error("Firebase Recaptcha init error. Make sure Firebase config is present.", err);
      }
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Ensure phone starts with country code, default to +91 if missing
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized. Check Firebase config.');
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowOtpInput(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please check the number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      // Send token to our backend
      await otpAuth(idToken, result.user.phoneNumber, 'user');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP or verification failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">
        <div id="recaptcha-container"></div>

        <div className="auth-header">
          <Link to="/" className="auth-brand">
            {logo ? <img src={logo} alt="Occupra" className="logo-auth-hero" /> :
              <span className="auth-brand-text">Occupra</span>}
          </Link>
          <div className="flex-col gap-1">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in with your phone number to continue</p>
          </div>
        </div>

        <div className="auth-card">
          {!showOtpInput ? (
            <form className="auth-form" onSubmit={handleSendOtp}>
              {error && (
                <div className="auth-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="label-base">Phone Number</label>
                <div className="input-with-icon">
                  <Phone className="input-icon" />
                  <input
                    type="tel" required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-base auth-input"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn btn-primary auth-btn h-11"
              >
                {loading ? <LoadingSpinner size="small" /> : (
                  <>Send OTP <ArrowRight size={16} className="ml-2" /></>
                )}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="auth-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="label-base">Enter OTP</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" />
                  <input
                    type="text" required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-base auth-input"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="btn btn-primary auth-btn h-11"
              >
                {loading ? <LoadingSpinner size="small" /> : (
                  <>Verify OTP <ArrowRight size={16} className="ml-2" /></>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowOtpInput(false)}
                className="btn btn-ghost mt-2 w-full"
                disabled={loading}
              >
                Change Phone Number
              </button>
            </form>
          )}

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
