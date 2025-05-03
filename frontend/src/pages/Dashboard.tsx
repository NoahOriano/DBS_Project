import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/items').then(res => setItems(res.data as any[]));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Your items</h1>
      <button
        onClick={() => navigate('/profile')}
        style={{ marginBottom: '1rem' }}
      >
        View Profile
      </button>
      <ul>
        {items.map(i => (
          <li key={i.Id}>{i.Name}</li>
        ))}
      </ul>
    </div>
  );
}
