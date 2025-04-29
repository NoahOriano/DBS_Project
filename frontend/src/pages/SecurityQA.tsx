import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

interface QAResponse {
  securityQuestion: string;
  userId: number;
}

export default function SecurityQA(): JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchQuestion = async () => {
    try {
      const { data } = await api.post<QAResponse>('/auth/security-question', {
        username,
        securityAnswer: answer,
      });
      setQuestion(data.securityQuestion);
      setUserId(data.userId);
    } catch {
      alert('Incorrect answer');
    }
  };

  const handleReset = async () => {
    const newPass = prompt('Enter new password:');
    if (userId && newPass) {
      await api.post('/auth/change-password', {
        userId,
        newPassword: newPass,
      });
      navigate('/login');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Reset via Security QA</h2>
      {!question ? (
        <>
          <div>
            <label>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label>Answer</label>
            <input
              type="password"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
          </div>
          <button onClick={fetchQuestion}>Verify</button>
        </>
      ) : (
        <>
          <p>
            <strong>Question:</strong> {question}
          </p>
          <button onClick={handleReset}>Reset Password</button>
        </>
      )}
    </div>
  );
}
