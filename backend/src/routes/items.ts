import { Router } from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const [rows]: any = await pool.execute('CALL spGetItemsForUser(?)', [req.user!.id]);
  res.json(rows[0]);
});

export default router;