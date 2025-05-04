import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NavBar from './components/NavBar';
import { useAuth } from './auth';
import { JSX } from 'react';
import Profile from './pages/Profile';

// Physician pages - These files need to exist in the correct location
import PhysicianDashboard from './pages/physician/PhysicianDashboard';
import BedManagement from './pages/physician/BedManagement';
import SOAPNotes from './pages/physician/SOAPNotes';
import LabOrders from './pages/physician/LabOrders';
import Prescriptions from './pages/physician/Prescriptions';
import PatientDetail from './pages/physician/PatientDetail';
import DischargePatient from './pages/physician/DischargePatient';

interface PrivateRouteProps {
  children: JSX.Element;
  roles?: string[];
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { token, user } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = roles.some(role => 
      userRoles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* General authenticated routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        
        {/* Physician routes */}
        <Route
          path="/physician/dashboard"
          element={
            <PrivateRoute roles={['physician']}>
              <PhysicianDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/physician/bed-management"
          element={
            <PrivateRoute roles={['physician']}>
              <BedManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/physician/soap-notes"
          element={
            <PrivateRoute roles={['physician']}>
              <SOAPNotes />
            </PrivateRoute>
          }
        />
        <Route
          path="/physician/lab-orders"
          element={
            <PrivateRoute roles={['physician']}>
              <LabOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/physician/prescriptions"
          element={
            <PrivateRoute roles={['physician']}>
              <Prescriptions />
            </PrivateRoute>
          }
        />
        <Route
          path="/physician/patient/:patientId"
          element={
            <PrivateRoute roles={['physician']}>
              <PatientDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/physician/discharge/:patientId"
          element={
            <PrivateRoute roles={['physician']}>
              <DischargePatient />
            </PrivateRoute>
          }
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}