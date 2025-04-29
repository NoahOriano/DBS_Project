// backend/src/index.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import roleRoutes from './routes/roles';
import itemRoutes from './routes/items';

dotenv.config();

const app = express();
app.use(
  cors({ origin: 'http://localhost:5173', credentials: true })
);
app.use(express.json());

// Auth & role management
app.use('/api/auth', authRoutes);
app.use('/api/auth/roles', roleRoutes);

// Your item routes
app.use('/api/items', itemRoutes);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`)
);
