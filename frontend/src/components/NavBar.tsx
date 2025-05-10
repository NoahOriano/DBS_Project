// src/components/NavBar.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function NavBar() {
  const { token, user, logout } = useAuth();
  const roles = user?.roles || [];

  const isAdmin = roles.includes('admin');
  const isPhysician = roles.includes('physician');

  const linkStyle = { margin: '0 1rem', color: '#fff', textDecoration: 'none' };

  return (
    <nav style={{ padding: '0.5rem 1rem', background: '#222', color: '#fff' }}>
      <Link to="/" style={linkStyle}>Home</Link>

      {token ? (
        <>
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          <Link to="/profile" style={linkStyle}>Profile</Link>
          <Link to="/change-password" style={linkStyle}>Change Password</Link>

          {roles.includes('patient') && (
            <>
              <Link to="/appointments" style={linkStyle}>Appointments</Link>
              <Link to="/payments" style={linkStyle}>Payments</Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin/beds" style={linkStyle}>Bed Admin</Link>
              <Link to="/admin/bed-rates" style={linkStyle}>Bed Rate Admin</Link>
              <Link to="/admin/schedule" style={linkStyle}>Schedule Admin</Link>
              <Link to="/admin/invoice/:billId" style={linkStyle}>Invoice Viewer</Link>
            </>
          )}

          {isPhysician && (
            <>
              <Link to="/physician/dashboard" style={linkStyle}>Physician Dashboard</Link>
              <Link to="/physician/bed-management" style={linkStyle}>Bed Management</Link>
              <Link to="/physician/soap-notes" style={linkStyle}>SOAP Notes</Link>
              <Link to="/physician/prescriptions" style={linkStyle}>Prescriptions</Link>
              <Link to="/physician/lab-orders" style={linkStyle}>Lab Orders</Link>
            </>
          )}

          <button
            onClick={logout}
            style={{
              marginLeft: '1rem',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={linkStyle}>Login</Link>
          <Link to="/forgot-password" style={linkStyle}>Forgot Password</Link>
          <Link to="/register" style={linkStyle}>Register</Link>
        </>
      )}
    </nav>
  );
}
