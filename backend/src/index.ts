import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import profileRoutes from './routes/profile';
import physicianRoutes from './routes/physician';
import adminRoutes from './routes/admin';


dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:4173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/physician', physicianRoutes);
app.use('/api/admin', adminRoutes);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));