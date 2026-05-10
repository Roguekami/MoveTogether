import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, MessageSquare, AlertTriangle, Calendar, User } from 'lucide-react';
import API from '../api';
import './ProfilePage.css'; // Reuse profile page styling

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDescription, setReportDescription] = useState('');
  const [reportStatus, setReportStatus] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const [userRes, ratingsRes] = await Promise.all([
        API.get(`/auth/user/${id}`),
        API.get(`/ratings/user/${id}`)
      ]);
      setUser(userRes.data.user);
      setRatings(ratingsRes.data.ratings);
    } catch (err) {
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to messages page with this user selected
    navigate(`/messages/${id}`);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    setReportStatus('Submitting...');
    try {
      await API.post('/reports', {
        reportedUserId: id,
        reason: reportReason,
        description: reportDescription
      });
      setReportStatus('Report submitted successfully.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportStatus('');
        setReportDescription('');
      }, 2000);
    } catch (err) {
      setReportStatus(err.response?.data?.message || 'Failed to submit report');
    }
  };

  if (loading) return <div className="loading-screen">Loading Profile...</div>;
  if (error) return <div className="profile-wrapper"><div className="error-msg">{error}</div></div>;
  if (!user) return <div className="profile-wrapper"><div className="error-msg">User not found</div></div>;

  return (
    <div className="profile-wrapper">
      <div className="profile-container" style={{ maxWidth: '800px' }}>
        
        {/* Profile Header */}
        <div className="profile-card card-shadow" style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
          <button 
            className="report-btn" 
            onClick={() => setShowReportModal(true)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <AlertTriangle size={16} /> Report
          </button>
          
          <div className="avatar-placeholder" style={{ width: '100px', height: '100px', margin: '0 auto 20px', background: 'var(--bg-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid var(--primary)' }}>
            {user.profilePicture ? (
              <img 
                src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`} 
                alt={user.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={40} color="var(--primary)" />
            )}
          </div>

          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            {user.name}
            {user.isEmailVerified && <ShieldCheck size={24} color="#10b981" title="Verified User" />}
          </h1>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={16} /> Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
            <span className="rating-badge" style={{ padding: '2px 10px', fontSize: '14px' }}>
              <Star size={14} fill="#F59E0B" color="#F59E0B" /> {user.averageRating > 0 ? user.averageRating : 'New'}
            </span>
          </div>

          <p style={{ maxWidth: '500px', margin: '0 auto 30px', color: 'var(--text-main)', lineHeight: '1.6' }}>
            {user.bio || "This user hasn't added a bio yet."}
          </p>

          <button className="btn-primary" onClick={handleMessage} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px' }}>
            <MessageSquare size={18} /> Message {user.name.split(' ')[0]}
          </button>
        </div>

        {/* Reviews Section */}
        <div className="profile-card card-shadow">
          <h2 style={{ marginBottom: '20px' }}>Reviews ({ratings.length})</h2>
          
          <div className="reviews-list">
            {ratings.length === 0 ? (
              <p className="no-reviews">No reviews yet.</p>
            ) : (
              ratings.map(rating => (
                <div key={rating._id} className="review-item">
                  <div className="review-header">
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={14} /> {rating.reviewerId?.name || 'Anonymous'}
                    </strong>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < rating.rating ? "#F59E0B" : "none"} color={i < rating.rating ? "#F59E0B" : "#ccc"} />
                      ))}
                    </div>
                  </div>
                  <p className="review-comment" style={{ marginTop: '8px' }}>"{rating.comment}"</p>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>
                    Trip: {rating.tripId?.title || 'Unknown'} • {new Date(rating.createdAt).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content card-shadow">
            <h2>Report {user.name}</h2>
            <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div className="input-group">
                <label className="input-label">REASON</label>
                <select 
                  className="input-soft" 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  <option>Spam</option>
                  <option>Harassment</option>
                  <option>Inappropriate Content</option>
                  <option>Safety Concern</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">DESCRIPTION</label>
                <textarea 
                  className="input-soft" 
                  rows="4" 
                  value={reportDescription} 
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide details..."
                  required
                />
              </div>

              {reportStatus && <p className={reportStatus.includes('success') ? 'success-msg' : 'error-msg'}>{reportStatus}</p>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowReportModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: '#ef4444' }}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
