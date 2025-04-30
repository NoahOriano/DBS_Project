import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState<'enterUsername' | 'answerQuestion'>('enterUsername');
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Step 1: fetch security question
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.get<{ securityQuestion: string }>(
        `/auth/security-question/${encodeURIComponent(username)}`
      );
      setSecurityQuestion(data.securityQuestion);
      setStep('answerQuestion');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to fetch security question');
    }
  };

  // Step 2: submit answer + new password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        username,
        answer,
        newPassword,
      });
      setSuccess('Password reset successfully. Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      {step === 'enterUsername' ? (
        <form onSubmit={handleUsernameSubmit}>
          <h2>Forgot Password</h2>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <div style={{ margin: '1rem 0' }}>
            <label>Username</label><br/>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" style={{ width: '100%' }}>
            Next
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit}>
          <h2>Answer Security Question</h2>
          <p><strong>Question:</strong> {securityQuestion}</p>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {success && <div style={{ color: 'green' }}>{success}</div>}
          <div style={{ margin: '1rem 0' }}>
            <label>Your Answer</label><br/>
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ margin: '1rem 0' }}>
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
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
}
