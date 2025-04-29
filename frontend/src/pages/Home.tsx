import React from 'react';
import { Link } from 'react-router-dom';

export default function Home(): JSX.Element {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Welcome to VictoryAI</h1>
      <p>
        Please <Link to="/login">Login</Link> or{' '}
        <Link to="/register">Register</Link> to continue.
      </p>
    </div>
  );
}
