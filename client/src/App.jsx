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
        
        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
        <Route path="/create" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
        <Route path="/edit-trip/:id" element={<PrivateRoute><EditTrip /></PrivateRoute>} />
        <Route path="/trip/:id" element={<PrivateRoute><TripDetail /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/messages/:recipientId" element={<PrivateRoute><Messages /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
