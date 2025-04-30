import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1) Create the user with chosen role
      await api.post('/auth/register', {
        username,
        password,
        role,              // ← send the selected role!
      });

      // 2) Set their security question & answer
      await api.post('/auth/set-security-qa', {
        username,
        securityQuestion,
        securityAnswer,
      });

      // 3) Redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Register</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <label>Username</label><br />
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Password</label><br />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Role</label><br />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          required
          style={{ width: '100%' }}
        >
          <option value="patient">Patient</option>
          <option value="physician">Physician</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Security Question</label><br />
        <input
          type="text"
          value={securityQuestion}
          onChange={e => setSecurityQuestion(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Answer to Security Question</label><br />
        <input
          type="text"
          value={securityAnswer}
          onChange={e => setSecurityAnswer(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>

      <button type="submit" style={{ width: '100%' }}>
        Sign Up
      </button>
    </form>
  );
}
