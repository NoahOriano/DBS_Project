import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get('/items').then(res => setItems(res.data));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Your items</h1>
      <ul>
        {items.map(i => (
          <li key={i.Id}>{i.Name}</li>
        ))}
      </ul>
    </div>
  );
}