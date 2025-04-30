import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to YourApp</h1>
      <p>Please <Link to="/login">Log in</Link> or <Link to="/register">Register</Link> to continue.</p>
    </div>
  );
}
