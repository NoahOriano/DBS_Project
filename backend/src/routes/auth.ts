// /mnt/data/DBS_Project-main/DBS_Project-main/backend/src/routes/auth.ts

import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, password, securityQuestion, securityAnswer, roleId } = req.body;
  try {
    await pool.execute('CALL sp_AddUser(?,?,?,?,?)', [
      username,
      password,
      securityQuestion,
      securityAnswer,
      roleId
    ]);
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    // fetch user record (direct SQL, since no sp_GetUserByUsername proc)
    const [rows]: any = await pool.execute(
      `SELECT u.user_id AS id,
              u.password_hash AS hash,
              u.active,
              r.role_name AS role
         FROM User u
         JOIN Role r ON u.role_id = r.role_id
        WHERE u.username = ?`,
      [username]
    );

    if (!rows.length || !rows[0].active) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username, roles: [user.role] },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  try {
    await pool.execute('CALL sp_UpdateUserPassword(?, ?)', [userId, newPassword]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
});

// POST /api/auth/security-question
router.post('/security-question', async (req: Request, res: Response) => {
  const { username, securityAnswer } = req.body;
  try {
    const [rows]: any = await pool.execute(
      `SELECT user_id AS id, security_question
         FROM User
        WHERE username = ?
          AND security_answer = SHA2(?,256)`,
      [username, securityAnswer]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Security answer incorrect' });
    }
    res.json({ userId: rows[0].id, securityQuestion: rows[0].security_question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;
