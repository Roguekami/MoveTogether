import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, FileText, Lock, ShieldCheck, Star, Eye, EyeOff, Camera } from 'lucide-react';
import API from '../api';
import './ProfilePage.css';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ 
    name: '', 
    bio: '', 
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await API.get('/auth/me');
      const userData = res.data.user;
      setUser(userData);
      setProfileForm({
        name: userData.name,
        bio: userData.bio || '',
        phone: userData.phone || '',
        emergencyContactName: userData.emergencyContact?.name || '',
        emergencyContactPhone: userData.emergencyContact?.phone || ''
      });
      if (userData.profilePicture) {
        setProfilePicPreview(userData.profilePicture);
      }

      // Fetch user ratings
      try {
        const ratingRes = await API.get(`/ratings/user/${userData._id}`);
        setRatings(ratingRes.data.ratings);
      } catch (rErr) {
        console.error("Failed to load ratings", rErr);
      }

    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = () => {
    if (!user) return 0;
    let score = 0;
    const totalFields = 5;
    if (user.name) score += 1;
    if (user.bio) score += 1;
    if (user.phone) score += 1;
    if (user.isEmailVerified) score += 1;
    if (user.emergencyContact?.name && user.emergencyContact?.phone) score += 1;
    return Math.round((score / totalFields) * 100);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Enforce profile picture
    if (!profilePicPreview && !profilePicFile) {
      setError('A profile picture is required. Please upload one.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('bio', profileForm.bio);
      formData.append('phone', profileForm.phone);
      formData.append('emergencyContact[name]', profileForm.emergencyContactName);
      formData.append('emergencyContact[phone]', profileForm.emergencyContactPhone);
      if (profilePicFile) {
        formData.append('profilePicture', profilePicFile);
      }

      const res = await API.put('/auth/profile', formData);
      setUser(res.data.user);
      
      // Update local storage so navbar sees the new picture immediately
      const storedUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...res.data.user, profilePicture: res.data.user.profilePicture }));

      if (res.data.user.profilePicture) setProfilePicPreview(res.data.user.profilePicture);
      setProfilePicFile(null);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
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

  if (loading) return <div className="loading-screen">Loading Profile...</div>;
  if (error && !user) return <div className="error-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', gap: '20px' }}><h2>{error}</h2><button className="btn-primary" onClick={() => window.location.reload()}>Retry</button></div>;
  if (!user) return <div className="error-screen" style={{ textAlign: 'center', padding: '50px' }}><h2>Profile not found</h2></div>;

  const completeness = calculateCompleteness();

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <header className="profile-header">
          <h1>
            
          </h1>
          <p>Manage your account, safety settings, and view feedback</p>
          
          <div className="completeness-bar-container">
            <div className="completeness-info">
              <span>Profile Completeness</span>
              <span>{completeness}%</span>
            </div>
            <div className="completeness-bar">
              <div className="completeness-fill" style={{ width: `${completeness}%`, background: completeness === 100 ? '#10b981' : 'var(--primary)' }}></div>
            </div>
          </div>
        </header>

        <div className="profile-grid">
          {/* Profile Info Section */}
          <div className="profile-card card-shadow">
            <h2>Profile & Safety</h2>
            <form onSubmit={handleProfileUpdate} className="profile-form">

              {/* Profile Picture Upload */}
              <div className="input-group" style={{ textAlign: 'center' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '12px' }}>PROFILE PICTURE <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{
                    width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 12px',
                    background: profilePicPreview ? 'transparent' : 'var(--surface-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: profilePicPreview ? '3px solid var(--primary)' : '2px dashed var(--border-color)',
                    overflow: 'hidden', cursor: 'pointer'
                  }}
                    onClick={() => document.getElementById('profilePicInput').click()}
                  >
                    {profilePicPreview
                      ? <img src={profilePicPreview.startsWith('blob:') ? profilePicPreview : (profilePicPreview.startsWith('http') ? profilePicPreview : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${profilePicPreview}`)}
                          alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Camera size={32} color="var(--text-muted)" />
                    }
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '12px', right: '0',
                    background: 'var(--primary)', borderRadius: '50%',
                    width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--card-bg)'
                  }}
                    onClick={() => document.getElementById('profilePicInput').click()}
                  >
                    <Camera size={14} color="white" />
                  </div>
                </div>
                <input
                  id="profilePicInput"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProfilePicFile(file);
                      setProfilePicPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {!profilePicPreview && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Profile picture is required</p>
                )}
                {profilePicFile && (
                  <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>New picture ready to upload ✓</p>
                )}
              </div>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label">FULL NAME</label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{profileForm.name.length}/50</span>
                </div>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="text"
                    maxLength={50}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    required
                  />
                  <User size={16} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label">BIO</label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{profileForm.bio.length}/200</span>
                </div>
                <div className="input-wrapper">
                  <textarea
                    className="input-soft"
                    rows="3"
                    maxLength={200}
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
                    type="tel"
                    pattern="[0-9+]*"
                    maxLength={15}
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value.replace(/[^0-9+]/g, '')})}
                    placeholder="+234..."
                  />
                  <Phone size={16} className="input-icon" />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label" style={{ color: 'var(--primary)' }}>EMERGENCY CONTACT NAME</label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{profileForm.emergencyContactName.length}/50</span>
                </div>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="text"
                    maxLength={50}
                    value={profileForm.emergencyContactName}
                    onChange={(e) => setProfileForm({...profileForm, emergencyContactName: e.target.value})}
                    placeholder="Who to contact in emergency"
                  />
                  <User size={16} className="input-icon" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: 'var(--primary)' }}>EMERGENCY CONTACT PHONE</label>
                <div className="input-wrapper">
                  <input
                    className="input-soft"
                    type="tel"
                    pattern="[0-9+]*"
                    maxLength={15}
                    value={profileForm.emergencyContactPhone}
                    onChange={(e) => setProfileForm({...profileForm, emergencyContactPhone: e.target.value.replace(/[^0-9+]/g, '')})}
                    placeholder="+234..."
                  />
                  <Phone size={16} className="input-icon" />
                </div>
              </div>

              <button type="submit" className="btn-primary">Update Profile</button>
            </form>
          </div>

          <div className="profile-right-column">
            {/* Reviews Section */}
            <div className="profile-card card-shadow" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Traveler Feedback</h2>
                <div className="rating-badge">
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  <span>{user.averageRating > 0 ? user.averageRating : 'New'}</span>
                </div>
              </div>
              
              <div className="reviews-list">
                {ratings.length === 0 ? (
                  <p className="no-reviews">No reviews yet. Complete some trips to get rated!</p>
                ) : (
                  ratings.map(rating => (
                    <div key={rating._id} className="review-item">
                      <div className="review-header">
                        <strong>{rating.reviewerId?.name}</strong>
                        <div className="stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < rating.rating ? "#F59E0B" : "none"} color={i < rating.rating ? "#F59E0B" : "#ccc"} />
                          ))}
                        </div>
                      </div>
                      <p className="review-comment">"{rating.comment}"</p>
                    </div>
                  ))
                )}
              </div>
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
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                      required
                    />
                    <button type="button" onClick={() => setShowOldPassword(!showOldPassword)}
                      style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">NEW PASSWORD</label>
                  <div className="input-wrapper">
                    <input
                      className="input-soft"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
        </div>

        {message && <p className="success-msg">{message}</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
