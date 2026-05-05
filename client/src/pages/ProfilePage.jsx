import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, FileText, Lock } from 'lucide-react';
import API from '../api';
import './ProfilePage.css';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
      setProfileForm({
        name: res.data.user.name,
        bio: res.data.user.bio || '',
        phone: res.data.user.phone || ''
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await API.put('/auth/profile', profileForm);
      setUser(res.data.user);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.put('/auth/password', passwordForm);
      setMessage("Password updated successfully!");
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    }
  };

  if (loading) return <div className="loading">Loading Sanctuary...</div>;

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <header className="profile-header">
          <h1>Your Sanctuary</h1>
          <p>Manage your account and security</p>
        </header>

        <div className="profile-grid">
          {/* Profile Info Section */}
          <div className="profile-card card-shadow">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="input-group">
                <label className="input-label">FULL NAME</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    required
                  />
                  <User size={16} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">BIO</label>
                <div className="input-wrapper">
                  <textarea
                    className="input-soft"
                    rows="3"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    placeholder="Tell us about your travel style..."
                  />
                  <FileText size={16} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">PHONE</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                  <Phone size={16} className="input-icon" />
                </div>
              </div>

              <button type="submit" className="btn-primary">Update Profile</button>
            </form>
          </div>

          {/* Security Section */}
          <div className="profile-card card-shadow">
            <h2>Security</h2>
            <form onSubmit={handlePasswordUpdate} className="profile-form">
              <div className="input-group">
                <label className="input-label">CURRENT PASSWORD</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                    required
                  />
                  <Lock size={16} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">NEW PASSWORD</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                  />
                  <Lock size={16} className="input-icon" />
                </div>
              </div>

              <button type="submit" className="btn-primary">Change Password</button>
            </form>

            <div className="logout-section">
                <button className="btn-social" onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}>Log Out</button>
            </div>
          </div>
        </div>

        {message && <p className="success-msg">{message}</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
