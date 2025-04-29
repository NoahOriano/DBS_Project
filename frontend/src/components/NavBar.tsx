import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function NavBar(): JSX.Element {
  const { token, logout } = useAuth();

  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/">Home</Link> |{' '}
      {token ? (
        <>
          <Link to="/dashboard">Dashboard</Link> |{' '}
          <Link to="/change-password">Change Password</Link> |{' '}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
