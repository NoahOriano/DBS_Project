import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function NavBar() {
  const { token, logout } = useAuth();
  return (
    <nav style={{ padding: '0.5rem 1rem', background: '#222', color: '#fff' }}>
      <span style={{ marginRight: '1rem' }}>SampleApp</span>
      {token ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}