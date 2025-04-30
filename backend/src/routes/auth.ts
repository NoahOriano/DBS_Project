import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authenticate, authorize, JwtPayload } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/register
// — patient self-signup (default role = "patient")
router.post(
  '/register',
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.execute('CALL spCreateUser(?, ?, ?)', [username, hash, 'patient']);

    res.status(201).json({ message: 'User created' });
  }
);

// POST /api/auth/set-security-qa
// — set the security question & answer hash for a given username
router.post(
  '/set-security-qa',
  async (req: Request, res: Response) => {
    const { username, securityQuestion, securityAnswer } = req.body;
    if (!username || !securityQuestion || !securityAnswer) {
      res.status(400).json({ message: 'Username, securityQuestion, and securityAnswer are required' });
      return;
    }

    // lookup user
    const [rows]: any = await pool.execute(
      'CALL spGetUserByUsername(?)',
      [username]
    );
    const user = rows[0][0];
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // hash the answer
    const answerHash = await bcrypt.hash(securityAnswer, 12);
    // store question + hash
    await pool.execute(
      'CALL spSetSecurityQA(?, ?, ?)',
      [user.Id, securityQuestion, answerHash]
    );

    res.json({ message: 'Security question set successfully' });
  }
);

// POST /api/auth/register/admin
router.post(
  '/register/admin',
  authenticate,
  authorize(['Admin']),
  async (req: Request, res: Response) => {
    const { username, password, roles } = req.body;
    if (!username || !password || !Array.isArray(roles)) {
      res.status(400).json({ message: 'Username, password and roles are required' });
      return;
    }
    if (roles.some((r: string) => !['Admin', 'Provider'].includes(r))) {
      res.status(400).json({ message: 'Roles must be Admin or Provider' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.execute('CALL spCreateUser(?, ?, ?)', [
      username,
      hash,
      roles.join(','),
    ]);

    res.status(201).json({ message: 'Admin/Provider user created' });
  }
);

// POST /api/auth/login
router.post(
  '/login',
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

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

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: 'Old and new passwords are required' });
      return;
    }

    const userId = (req.user as JwtPayload).id;
    const [rows]: any = await pool.execute('CALL spGetUserById(?)', [userId]);
    const user = rows[0][0];
    if (!user || !(await bcrypt.compare(oldPassword, user.PasswordHash))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute('CALL spChangePassword(?, ?)', [userId, hash]);

    res.json({ message: 'Password changed successfully' });
  }
);

// GET /api/auth/security-question/:username
router.get(
  '/security-question/:username',
  async (req: Request, res: Response) => {
    const { username } = req.params;
    const [rows]: any = await pool.execute(
      'CALL spGetSecurityQAByUsername(?)',
      [username]
    );
    const data = rows[0][0];
    if (!data) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!data.SecurityQuestion) {
      res.status(400).json({ message: 'Security question not set' });
      return;
    }
    res.json({ securityQuestion: data.SecurityQuestion });
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  async (req: Request, res: Response) => {
    const { username, answer, newPassword } = req.body;
    if (!username || !answer || !newPassword) {
      res.status(400).json({ message: 'Username, answer, and newPassword are required' });
      return;
    }

    const [rows]: any = await pool.execute(
      'CALL spGetSecurityQAByUsername(?)',
      [username]
    );
    const data = rows[0][0];
    if (!data) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!data.SecurityAnswerHash) {
      res.status(400).json({ message: 'Security QA not set up for this user' });
      return;
    }

    const matches = await bcrypt.compare(answer, data.SecurityAnswerHash);
    if (!matches) {
      res.status(401).json({ message: 'Invalid security answer' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute('CALL spChangePassword(?, ?)', [data.Id, hash]);

    res.json({ message: 'Password reset successfully' });
  }
);

export default router;
