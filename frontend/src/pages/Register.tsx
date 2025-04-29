import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

type Role = { role_id: number; role_name: string };

export default function Register(): JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [securityQuestion, setSecurityQuestion] = useState<string>('');
  const [securityAnswer, setSecurityAnswer] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState<number>(1);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    api
      .get<Role[]>('/auth/roles')
      .then(res => setRoles(res.data))
      .catch(err => console.error('Failed to fetch roles', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const resp = await api.post('/auth/register', {
        username,
        password,
        securityQuestion,
        securityAnswer,
        roleId,
      });
      if (resp.status === 201) {
        const loginResp = await api.post<{ token: string }>('/auth/login', {
          username,
          password,
        });
        login(loginResp.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration failed', err);
      alert('Registration error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Register</h2>

      <div>
        <label>Username</label>
        <input
          required
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label>Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label>Security Question</label>
        <input
          required
          value={securityQuestion}
          onChange={e => setSecurityQuestion(e.target.value)}
        />
      </div>

      <div>
        <label>Answer</label>
        <input
          required
          type="password"
          value={securityAnswer}
          onChange={e => setSecurityAnswer(e.target.value)}
        />
      </div>

      <div>
        <label>Role</label>
        <select
          value={roleId}
          onChange={e => setRoleId(Number(e.target.value))}
        >
          {roles.map(r => (
            <option key={r.role_id} value={r.role_id}>
              {r.role_name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
