import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Role-Based LayoutS
import UserLayout from './views/user/UserLayout';
import OwnerLayout from './views/owner/OwnerLayout';
import AdminLayout from './views/admin/AdminLayout';
import Navbar from './components/Navbar';

// Public Facing Pages
import MapView from './pages/MapView';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import PropertyDetails from './pages/PropertyDetails';

// User Panel Views
import UserDashboard from './views/user/UserDashboard';
import ExploreProperties from './pages/MapView'; // Alias MapView for User Explore
import MyBookings from './views/user/MyBookings';

// Owner Panel Views
import OwnerDashboard from './views/owner/OwnerDashboard';
import ManageProperties from './views/owner/ManageProperties';
import ManageBookings from './views/owner/ManageBookings';
import ManageAvailability from './views/owner/ManageAvailability';

// Admin Panel Views
import AdminDashboard from './views/admin/AdminDashboard';
import AdminUsers from './views/admin/AdminUsers';
import AdminProperties from './views/admin/AdminProperties';
import AdminBookings from './views/admin/AdminBookings';
import AdminLogin from './views/admin/AdminLogin';
import AdminStaff from './views/admin/AdminStaff';
import AdminLogs from './pages/admin/AdminLogs';

import LoadingSpinner from './components/common/LoadingSpinner';
import ChangePassword from './components/settings/ChangePassword';
import StatusOverlay from './components/StatusOverlay';

/**
 * ROOT REDIRECT LOGIC
 * Intelligent routing based on current authenticated state
 */
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner fullScreen text="Initialising Core Systems" />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const adminRoles = ['master_admin', 'admin', 'employee', 'worker'];
  if (adminRoles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to={`/${user.role}/dashboard`} replace />;
};

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Router>
      <StatusOverlay />
      <Routes>
        {/* PUBLIC SYSTEM ROUTES */}
        <Route path="/" element={<><Navbar /><div style={{ height: 'calc(100vh - 80px)', marginTop: '80px' }}><MapView /></div></>} />
        <Route path="/about" element={<><Navbar /><div style={{ paddingTop: '80px' }}><About /></div></>} />
        <Route path="/login" element={<><Navbar /><div style={{ paddingTop: '80px' }}><Login /></div></>} />
        <Route path="/register" element={<><Navbar /><div style={{ paddingTop: '80px' }}><Register /></div></>} />
        <Route path="/forgot-password" element={<><Navbar /><div style={{ paddingTop: '80px' }}><ForgotPassword /></div></>} />
        <Route path="/reset-password/:token" element={<><Navbar /><div style={{ paddingTop: '80px' }}><ResetPassword /></div></>} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* TENANT PORTAL (User Role) */}
        <Route path="/user" element={<UserLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="explore" element={<div style={{ height: 'calc(100vh - 120px)' }}><ExploreProperties /></div>} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="settings" element={<div className="p-8"><ChangePassword /></div>} />
          <Route index element={<Navigate to="/user/dashboard" replace />} />
        </Route>

        {/* LANDLORD PORTAL (Owner Role) */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="properties" element={<ManageProperties />} />
          <Route path="properties/new" element={<ManageProperties />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="availability" element={<ManageAvailability />} />
          <Route path="settings" element={<div className="p-8"><ChangePassword /></div>} />
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
        </Route>

        {/* PLATFORM OPERATIONS (Admin Role) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="settings" element={<div className="p-8"><ChangePassword /></div>} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* SYSTEM REDIRECTORS */}
        <Route path="/dashboard" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
