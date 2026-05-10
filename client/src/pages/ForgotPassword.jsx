import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader } from 'lucide-react';
import API from '../api';
import './AuthPage.css'; // Re-use auth styles

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await API.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card-shadow">
                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive a reset link</p>
                </div>

                {message && <div className="auth-success" style={{background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center'}}>{message}</div>}
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="input-soft"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <Loader size={20} className="spinner" /> : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '24px' }}>
                    <Link to="/auth" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
