import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import api from '../api';

export default function PatientPayments() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [billId, setBillId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Card'|'Cash'|'Check'|'ACH'>('Card');

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // placeholder only — implement actual API call later
      await api.post('/patient/payments', { billId, amount, method });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>Make Payments</h2>

      {submitted ? (
        <p style={{ color: 'green' }}>
          Payment submitted! (This is just a placeholder.)
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ marginBottom: '1rem' }}>
            <label>Bill ID:</label><br/>
            <input
              type="text"
              value={billId}
              onChange={e => setBillId(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Amount:</label><br/>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Payment Method:</label><br/>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              style={{ width: '100%' }}
            >
              <option>Card</option>
              <option>Cash</option>
              <option>Check</option>
              <option>ACH</option>
            </select>
          </div>
          <button type="submit" style={{ width: '100%' }}>
            Submit Payment
          </button>
        </form>
      )}
    </div>
  );
}
