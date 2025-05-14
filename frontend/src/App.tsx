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
import PatientAppointments from './pages/PatientAppointments';
import PatientPayments from './pages/PatientPayments';
import BedAdmin from './pages/BedAdmin';
import PhysicianScheduleAdmin from './pages/PhysicianScheduleAdmin';
import BedRateAdmin from './pages/BedRateAdmin';
import InvoiceViewer from './pages/InvoiceViewer';

import PhysicianDashboard from './pages/Physician/PhysicianDashboard';
import BedManagement from './pages/Physician/BedManagement';
import SOAPNotes from './pages/Physician/SOAPNotes';
import LabOrders from './pages/Physician/LabOrders';
import Prescriptions from './pages/Physician/Prescriptions';
import DischargePatient from './pages/Physician/DischargePatient';
import PatientDetail from './pages/Physician/PatientDetail';

interface PrivateRouteProps {
  children: JSX.Element;
  roles?: string[];
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { token, user } = useAuth() as { token: string; user?: { roles: string[] } };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default function App() {
  const { token } = useAuth();

  return (
    <>
      {token && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><PatientAppointments /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><PatientPayments /></PrivateRoute>} />

        <Route path="/physician/dashboard" element={<PrivateRoute roles={['physician']}><PhysicianDashboard /></PrivateRoute>} />
        <Route path="/physician/bed-management" element={<PrivateRoute roles={['physician']}><BedManagement /></PrivateRoute>} />
        <Route path="/physician/soap-notes" element={<PrivateRoute roles={['physician']}><SOAPNotes /></PrivateRoute>} />
        <Route path="/physician/lab-orders" element={<PrivateRoute roles={['physician']}><LabOrders /></PrivateRoute>} />
        <Route path="/physician/prescriptions" element={<PrivateRoute roles={['physician']}><Prescriptions /></PrivateRoute>} />
        <Route path="/physician/patient/:patientId" element={<PrivateRoute roles={['physician']}><PatientDetail /></PrivateRoute>} />
        <Route path="/physician/discharge/:patientId" element={<PrivateRoute roles={['physician']}><DischargePatient /></PrivateRoute>} />

        <Route path="/admin/beds" element={<PrivateRoute roles={['admin']}><BedAdmin /></PrivateRoute>} />
        <Route path="/admin/schedule" element={<PrivateRoute roles={['admin']}><PhysicianScheduleAdmin /></PrivateRoute>} />
        <Route path="/admin/bed-rates" element={<PrivateRoute roles={['admin']}><BedRateAdmin /></PrivateRoute>} />
        <Route path="/admin/invoice/:billId" element={<PrivateRoute roles={['admin']}><InvoiceViewer /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
