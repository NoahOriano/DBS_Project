// backend/src/routes/auth.ts

import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authenticate, authorize, JwtPayload } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  async (req: Request, res: Response): Promise<void> => {
    let { username, password, role } = req.body;

    // 1) Validate presence
    if (!username || !password || !role) {
      res.status(400).json({ message: 'Username, password and role are required' });
      return;
    }

    // 2) Normalize & validate role
    role = String(role).toLowerCase();
    const allowed = ['patient', 'physician', 'admin'];
    if (!allowed.includes(role)) {
      res.status(400).json({ message: 'Role must be one of: patient, physician, admin' });
      return;
    }

    // 3) Hash password and create user
    const hash = await bcrypt.hash(password, 12);
    await pool.execute('CALL spCreateUser(?, ?, ?)', [username, hash, role]);

    // 4) Lookup the new user's Id
    const [userRows]: any = await pool.execute('CALL spGetUserByUsername(?)', [username]);
    const userId: number = userRows[0][0].Id;

    // 5) Initialize their empty profile row
    if (role === 'patient') {
      await pool.execute('INSERT IGNORE INTO PATIENT (User_Id) VALUES(?)', [userId]);
    } else if (role === 'physician') {
      await pool.execute('INSERT IGNORE INTO PHYSICIAN (User_Id) VALUES(?)', [userId]);
    } else /* admin */ {
      await pool.execute('INSERT IGNORE INTO ADMIN_PROFILE (User_Id) VALUES(?)', [userId]);
    }

    // 6) Respond
    res.status(201).json({ message: 'User created and profile initialized' });
  }
);

// POST /api/auth/set-security-qa
router.post(
  '/set-security-qa',
  async (req: Request, res: Response) => {
    const { username, securityQuestion, securityAnswer } = req.body;
    if (!username || !securityQuestion || !securityAnswer) {
      res.status(400).json({ message: 'Username, securityQuestion, and securityAnswer are required' });
      return;
    }

    // lookup user
    const [rows]: any = await pool.execute('CALL spGetUserByUsername(?)', [username]);
    const user = rows[0][0];
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // hash the answer and store
    const answerHash = await bcrypt.hash(securityAnswer, 12);
    await pool.execute('CALL spSetSecurityQA(?, ?, ?)', [user.Id, securityQuestion, answerHash]);

    res.json({ message: 'Security question set successfully' });
  }
);

// POST /api/auth/register/admin
router.post(
  '/register/admin',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response) => {
    let { username, password, roles } = req.body;
    if (!username || !password || !Array.isArray(roles)) {
      res.status(400).json({ message: 'Username, password and roles are required' });
      return;
    }

    // normalize & validate each role
    const normalized = roles.map((r: string) => String(r).toLowerCase());
    if (normalized.some((r: string) => !['patient','physician','admin'].includes(r))) {
      res.status(400).json({ message: 'Roles must be patient, physician, or admin' });
      return;
    }

    // hash + create
    const hash = await bcrypt.hash(password, 12);
    await pool.execute('CALL spCreateUser(?, ?, ?)', [
      username,
      hash,
      normalized.join(','),
    ]);

    res.status(201).json({ message: 'Admin user created' });
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

    // split and lowercase roles
    const rolesArray = (user.Roles as string)
      .split(',')
      .map((r: string) => r.trim().toLowerCase());

    const token = jwt.sign(
      { id: user.Id, username, roles: rolesArray },
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
    const [rows]: any = await pool.execute('CALL spGetSecurityQAByUsername(?)', [username]);
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

    const [rows]: any = await pool.execute('CALL spGetSecurityQAByUsername(?)', [username]);
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

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  async (req, res) => {
    const userId = (req.user as JwtPayload).id;
    const [rows]: any = await pool.execute('CALL spGetUserById(?)', [userId]);
    const u = rows[0][0];

    // split+lowercase roles
    const rolesArray = (u.Roles as string)
      .split(',')
      .map((r: string) => r.trim().toLowerCase());

    res.json({
      id: u.Id,
      username: u.Username,
      roles: rolesArray,
      securityQuestion: u.SecurityQuestion,
    });
  }
);

// PUT /api/auth/me
router.put(
  '/me',
  authenticate,
  async (req: Request, res: Response) => {
    const userId = (req.user as JwtPayload).id;
    const { securityQuestion, securityAnswer } = req.body;
    if (!securityQuestion || !securityAnswer) {
      res.status(400).json({ message: 'Question and answer are required' });
      return;
    }
    const hash = await bcrypt.hash(securityAnswer, 12);
    await pool.execute('CALL spSetSecurityQA(?, ?, ?)', [
      userId,
      securityQuestion,
      hash,
    ]);
    res.json({ message: 'Profile updated' });
  }
);

export default router;
