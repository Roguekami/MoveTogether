import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import EditTrip from './pages/EditTrip';
import TripDetail from './pages/TripDetail';
import ProfilePage from './pages/ProfilePage';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import CheckEmailPage from './pages/CheckEmailPage';
import PublicProfile from './pages/PublicProfile';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<CheckEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
        <Route path="/create" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
        <Route path="/edit-trip/:id" element={<PrivateRoute><EditTrip /></PrivateRoute>} />
        <Route path="/trip/:id" element={<PrivateRoute><TripDetail /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/:recipientId" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/user/:id" element={<PrivateRoute><PublicProfile /></PrivateRoute>} />
        
        {/* Admin Route */}
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
