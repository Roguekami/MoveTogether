import React, { useState, useEffect } from 'react';
import API from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [reports, setReports] = useState([]);
  const [view, setView] = useState('stats'); // 'stats', 'users', 'trips', 'reports'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/trips');
      setTrips(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/reports');
      setReports(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (newView) => {
    setView(newView);
    if (newView === 'stats') fetchStats();
    if (newView === 'users') fetchUsers();
    if (newView === 'trips') fetchTrips();
    if (newView === 'reports') fetchReports();
  };

  const suspendUser = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/suspend`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to suspend user');
    }
  };

  const deleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;
    try {
      await API.delete(`/admin/trips/${tripId}`);
      fetchTrips(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete trip');
    }
  };

  const resolveReport = async (reportId) => {
    try {
      await API.put(`/admin/reports/${reportId}/resolve`);
      fetchReports(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve report');
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-container">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage users, trips, reports, and platform health.</p>
        </header>

        <div className="admin-nav">
          <button className={view === 'stats' ? 'active' : ''} onClick={() => handleNavClick('stats')}>Stats</button>
          <button className={view === 'users' ? 'active' : ''} onClick={() => handleNavClick('users')}>Users</button>
          <button className={view === 'trips' ? 'active' : ''} onClick={() => handleNavClick('trips')}>Trips</button>
          <button className={view === 'reports' ? 'active' : ''} onClick={() => handleNavClick('reports')}>Reports</button>
        </div>

        {error && <p className="error-msg">{error}</p>}
        {loading && <div className="loading">Loading...</div>}

        {!loading && view === 'stats' && (
          <div className="stats-grid">
            <div className="stat-card card-shadow">
              <h3>Total Users</h3>
              <p className="stat-value">{stats.totalUsers || 0}</p>
            </div>
            <div className="stat-card card-shadow">
              <h3>Total Trips</h3>
              <p className="stat-value">{stats.totalTrips || 0}</p>
            </div>
            <div className="stat-card card-shadow">
              <h3>Active Trips</h3>
              <p className="stat-value">{stats.activeTrips || 0}</p>
            </div>
            <div className="stat-card card-shadow">
              <h3>Completed Trips</h3>
              <p className="stat-value">{stats.completedTrips || 0}</p>
            </div>
            <div className="stat-card card-shadow warning-stat">
              <h3>Pending Reports</h3>
              <p className="stat-value">{stats.pendingReports || 0}</p>
            </div>
          </div>
        )}

        {!loading && view === 'users' && (
          <div className="table-container card-shadow">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className={user.isSuspended ? 'suspended-row' : ''}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.tripsCreated}</td>
                    <td>{user.tripsJoined}</td>
                    <td>
                      <span className={`status-badge ${user.isSuspended ? 'suspended' : 'active'}`}>
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {user.role !== 'admin' && (
                        <button 
                          className={`btn-action ${user.isSuspended ? 'unsuspend' : 'suspend'}`}
                          onClick={() => suspendUser(user._id)}
                        >
                          {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && view === 'trips' && (
          <div className="table-container card-shadow">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip._id}>
                    <td>{trip.title}</td>
                    <td>{trip.creator?.name || 'Unknown'}</td>
                    <td>
                      <span className={`status-badge ${trip.status}`}>{trip.status}</span>
                    </td>
                    <td>₦{trip.totalCost?.toLocaleString() || 0}</td>
                    <td>
                      <button className="btn-action suspend" onClick={() => deleteTrip(trip._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && view === 'reports' && (
          <div className="table-container card-shadow">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Reported User</th>
                  <th>Reason</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No reports found.</td></tr>
                ) : reports.map(report => (
                  <tr key={report._id}>
                    <td>{report.reporterId?.name || 'Unknown'}</td>
                    <td>{report.reportedUserId?.name || 'Unknown'}</td>
                    <td>{report.reason}</td>
                    <td style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={report.description}>
                      {report.description}
                    </td>
                    <td>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </td>
                    <td>
                      {report.status !== 'resolved' && (
                        <button className="btn-action resolve" onClick={() => resolveReport(report._id)}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
