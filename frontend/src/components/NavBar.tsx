// src/components/NavBar.tsx

import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function NavBar() {
  const { token, roles = [], logout } = useAuth();
  const linkStyle = { margin: '0 1rem', color: '#fff', textDecoration: 'none' };

  return (
    <nav style={{ padding: '0.5rem 1rem', background: '#222', color: '#fff' }}>
      <Link to="/" style={{ marginRight: '1rem', color: '#fff', textDecoration: 'none' }}>
        Home
      </Link>

      {token ? (
        <>
          <Link to="/dashboard" style={linkStyle}>
            Dashboard
          </Link>
          <Link to="/profile" style={linkStyle}>
            Profile
          </Link>
          <Link to="/change-password" style={linkStyle}>
            Change Password
          </Link>

          <Link to="/appointments" style={linkStyle}>
            Appointments
          </Link>
          <Link to="/payments" style={linkStyle}>
            Payments
          </Link>
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
          <Link to="/login" style={linkStyle}>
            Login
          </Link>
          <Link to="/forgot-password" style={linkStyle}>
            Forgot Password
          </Link>
          <Link to="/register" style={linkStyle}>
            Register
          </Link>
        </>
      )}
    </nav>
  );
}
