import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function NavBar() {
  const { token, logout } = useAuth();

  return (
    <nav style={{ padding: '0.5rem 1rem', background: '#222', color: '#fff' }}>
      <Link
        to="/"
        style={{ marginRight: '1rem', color: '#fff', textDecoration: 'none' }}
      >
        Home
      </Link>

      {token ? (
        <>
          <Link
            to="/dashboard"
            style={{ margin: '0 1rem', color: '#fff', textDecoration: 'none' }}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            style={{ margin: '0 1rem', color: '#fff', textDecoration: 'none' }}
          >
            Profile
          </Link>
          <Link
            to="/change-password"
            style={{ margin: '0 1rem', color: '#fff', textDecoration: 'none' }}
          >
            Change Password
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
          <Link
            to="/login"
            style={{ margin: '0 1rem', color: '#fff', textDecoration: 'none' }}
          >
            Login
          </Link>
          <Link
            to="/forgot-password"
            style={{ margin: '0 1rem', color: '#fff', textDecoration: 'none' }}
          >
            Forgot Password
          </Link>
          <Link
            to="/register"
            style={{ margin: '0 1rem', color: '#fff', textDecoration: 'none' }}
          >
            Register
          </Link>
        </>
      )}
    </nav>
  );
}
