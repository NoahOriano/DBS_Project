import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    const hash = await bcrypt.hash(password, 12);
    await pool.execute('CALL spCreateUser(?, ?)', [username, hash]);

    res.sendStatus(201);          // ← no `return`
  }
);

// POST /api/auth/login
router.post(
  '/login',
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    // mysql2 returns: [ [rows], [procedure-metadata] ]
    const [rows]: any = await pool.execute('CALL spGetUserByUsername(?)', [username]);
    const user = rows[0][0];

    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.Id, username, roles: user.Roles.split(',') },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );

    res.json({ token });
  }
);

export default router;