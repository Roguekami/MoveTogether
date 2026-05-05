import React, { useState } from 'react';
import { AtSign, Lock } from 'lucide-react';
import API from '../api';
import './AuthPage.css';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [form, setForm] = useState({ name: '', email: '', password: '', token: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'login') {
        const res = await API.post('/auth/login', {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        alert(`Welcome back, ${res.data.user.name}!`);
      } else if (mode === 'signup') {
        const res = await API.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        alert(`Account created! Welcome, ${res.data.user.name}! Please log in.`);
        setMode('login');
      } else if (mode === 'forgot') {
        await API.post('/auth/forgot-password', {
          email: form.email
        });
        setMessage(`A reset token has been generated. Check your server terminal!`);
        setMode('reset');
      } else if (mode === 'reset') {
        await API.post('/auth/reset-password', {
          token: form.token,
          newPassword: form.password
        });
        alert("Password reset successfully! Please log in.");
        setMode('login');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      const msg = err.response?.data?.message || err.message || 'Connection failed';
      setError(msg);
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
          <p className="auth-subtitle">
            {mode === 'login' && 'Welcome back to the community.'}
            {mode === 'signup' && 'Join the movement today.'}
            {mode === 'forgot' && 'Reset your password.'}
            {mode === 'reset' && 'Enter your reset token and new password.'}
          </p>
        </div>

        <div className="auth-card card-shadow">
          {(mode === 'login' || mode === 'signup') && (
            <div className={`toggle-pill ${mode === 'signup' ? 'signup-active' : ''}`}>
              <div className="slider" />
              <button
                className={mode === 'login' ? 'active' : ''}
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              >
                Login
              </button>
              <button
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
              >
                Sign Up
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="input-group">
                <label className="input-label">FULL NAME</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div className="input-group">
                <label className="input-label">ACCOUNT ACCESS</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="email"
                    name="email"
                    placeholder="Email or Phone Number"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <AtSign size={16} className="input-icon" />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="input-group">
                <label className="input-label">RESET TOKEN</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="text"
                    name="token"
                    placeholder="Paste your reset token"
                    value={form.token}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div className="input-group">
                <div className="input-label-row">
                  <label className="input-label">{mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'}</label>
                  {mode === 'login' && (
                    <button type="button" className="forgot-link" onClick={() => setMode('forgot')}>Forgot?</button>
                  )}
                </div>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="password"
                    name="password"
                    placeholder={mode === 'reset' ? 'Enter new password' : 'Your password'}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <Lock size={16} className="input-icon" />
                </div>
              </div>
            )}

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message" style={{ color: 'var(--primary)', fontSize: '12px', textAlign: 'center' }}>{message}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : 
                mode === 'login' ? 'Log In' : 
                mode === 'signup' ? 'Create Account' : 
                mode === 'forgot' ? 'Send Reset Link' : 'Reset Password'
              }
            </button>

            {(mode === 'forgot' || mode === 'reset') && (
              <button type="button" className="forgot-link" onClick={() => { setMode('login'); setMessage(''); setError(''); }} style={{ marginTop: '10px' }}>
                Back to Login
              </button>
            )}
          </form>

          <div className="social-section">
            <span className="social-divider">OR CONTINUE WITH</span>
            <button className="btn-social" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <p className="auth-footer-text">
          By continuing, you agree to our{' '}
          <a href="#">Safety Guidelines</a> and <a href="#">Terms of Service</a>.
        </p>
      </div>

      <footer className="auth-page-footer">
        <span>MoveTogether &copy; 2024. A Social Sanctuary for Student Travel.</span>
        <nav>
          <a href="#">About Us</a>
          <a href="#">Terms of Service</a>
          <a href="#">Safety Guidelines</a>
          <a href="#">Contact Support</a>
        </nav>
      </footer>
    </div>
  );
}
