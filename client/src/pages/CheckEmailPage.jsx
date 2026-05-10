import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';
import './AuthPage.css'; // Reuse auth styles

export default function CheckEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await API.post('/auth/verify-email', { email, code });
      alert('Email verified successfully! You can now log in.');
      navigate('/auth');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please provide an email to resend the code.");
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await API.post('/auth/resend-code', { email });
      setMessage("Verification code resent! Check your terminal.");
    } catch (err) {
      setError(err.response?.data?.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">MoveTogether</h1>
          <p className="auth-subtitle">Verify your email address</p>
        </div>

        <div className="auth-card card-shadow">
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="input-group">
              <label className="input-label">EMAIL ADDRESS</label>
              <div className="input-wrapper">
                <input
                  className="input-soft"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">VERIFICATION CODE</label>
              <div className="input-wrapper">
                <input
                  className="input-soft"
                  type="text"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message" style={{ color: 'var(--primary)', fontSize: '12px', textAlign: 'center' }}>{message}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button 
              type="button" 
              className="forgot-link" 
              onClick={handleResend} 
              style={{ marginTop: '15px', display: 'block', width: '100%', textAlign: 'center' }}
            >
              Didn't receive a code? Resend
            </button>

            <button 
              type="button" 
              className="forgot-link" 
              onClick={() => navigate('/auth')} 
              style={{ marginTop: '10px', display: 'block', width: '100%', textAlign: 'center' }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
