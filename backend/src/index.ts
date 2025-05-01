import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/profile', profileRoutes);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));