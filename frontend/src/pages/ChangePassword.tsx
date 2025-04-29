import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

interface JwtPayload {
  id: number;
  username: string;
  roles: string[];
}

function parseJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function ChangePassword(): JSX.Element {
  const { logout, token } = useAuth();
  const [newPassword, setNewPassword] = useState<string>('');
  const navigate = useNavigate();

  const userId = token ? parseJwt(token)?.id : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    try {
      await api.post('/auth/change-password', { userId, newPassword });
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Password change failed', err);
      alert('Error updating password');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: '2rem auto' }}>
      <h2>Change Password</h2>
      <div>
        <label>New Password</label>
        <input
          required
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
      </div>
      <button type="submit">Update</button>
    </form>
  );
}
