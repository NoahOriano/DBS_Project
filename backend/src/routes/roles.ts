// /mnt/data/DBS_Project-main/DBS_Project-main/backend/src/routes/roles.ts

import express, { Request, Response } from 'express';
import { pool } from '../db';

const router = express.Router();

// GET /api/auth/roles
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute('CALL sp_GetAllRoles()');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Cannot fetch roles' });
  }
});

// POST /api/auth/roles
router.post('/', async (req: Request, res: Response) => {
  const { roleName } = req.body;
  try {
    await pool.execute('CALL sp_AddRole(?)', [roleName]);
    res.status(201).json({ message: 'Role created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Role creation failed' });
  }
});

export default router;
