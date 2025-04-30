import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(
      '/auth/change-password',
      { oldPassword, newPassword }
    );
    navigate('/dashboard');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: '2rem auto' }}
    >
      <h2>Change Password</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>Current Password</label><br/>
        <input
          type="password"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>New Password</label><br/>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>
      <button type="submit" style={{ width: '100%' }}>
        Update Password
      </button>
    </form>
  );
}
