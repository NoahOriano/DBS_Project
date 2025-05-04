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
    const { username, password, role } = req.body;

    // 1) Validate
    if (!username || !password || !role) {
      res.status(400).json({ message: 'Username, password and role are required' });
      return;
    }
    const allowed = ['patient', 'physician', 'admin'];
    if (!allowed.includes(role)) {
      res.status(400).json({ message: 'Role must be one of: patient, physician, admin' });
      return;
    }

    try {
      // 2) Hash + create user
      const hash = await bcrypt.hash(password, 12);
      await pool.execute('CALL spCreateUser(?, ?, ?)', [username, hash, role]);

      // 3) Lookup the new user's Id
      const [userRows]: any = await pool.execute('CALL spGetUserByUsername(?)', [username]);
      const userId: number = userRows[0][0].Id;

      // 4) Initialize their profile row
      if (role === 'patient') {
        await pool.execute(
          'INSERT IGNORE INTO PATIENT (User_Id) VALUES(?)',
          [userId]
        );
      } else if (role === 'physician') {
        await pool.execute(
          'INSERT IGNORE INTO PHYSICIAN (User_Id) VALUES(?)',
          [userId]
        );
      } else { // admin
        await pool.execute(
          'INSERT IGNORE INTO ADMIN_PROFILE (User_Id) VALUES(?)',
          [userId]
        );
      }

      // 5) Finish
      res.status(201).json({ message: 'User created and profile initialized' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
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

    try {
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
    } catch (error) {
      console.error('Set security QA error:', error);
      res.status(500).json({ message: 'Failed to set security question' });
    }
  }
);

// POST /api/auth/register/admin
router.post(
  '/register/admin',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response) => {
    const { username, password, roles } = req.body;
    if (!username || !password || !Array.isArray(roles)) {
      res.status(400).json({ message: 'Username, password and roles are required' });
      return;
    }
    if (roles.some((r: string) => !['admin', 'provider'].includes(r))) {
      res.status(400).json({ message: 'Roles must be admin or provider' });
      return;
    }

    try {
      const hash = await bcrypt.hash(password, 12);
      await pool.execute('CALL spCreateUser(?, ?, ?)', [
        username,
        hash,
        roles.join(','),
      ]);

      res.status(201).json({ message: 'Admin/Provider user created' });
    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
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

    try {
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
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
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

    try {
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
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  }
);

// GET /api/auth/security-question/:username
router.get(
  '/security-question/:username',
  async (req: Request, res: Response) => {
    const { username } = req.params;
    try {
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
    } catch (error) {
      console.error('Get security question error:', error);
      res.status(500).json({ message: 'Failed to get security question' });
    }
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

    try {
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
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  async (req, res) => {
    try {
      const userId = (req.user as JwtPayload).id;
      const [rows]: any = await pool.execute('CALL spGetUserById(?)', [userId]);
      const u = rows[0][0];
      res.json({
        id: u.Id,
        username: u.Username,
        roles: u.Roles.split(','),
        securityQuestion: u.SecurityQuestion,
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({ message: 'Failed to get user information' });
    }
  }
);

// PUT /api/auth/me
router.put(
  '/me',
  authenticate,
  async (req, res) => {
    const userId = (req.user as JwtPayload).id;
    const { securityQuestion, securityAnswer } = req.body;
    if (!securityQuestion || !securityAnswer) {
      res.status(400).json({ message: 'Question and answer are required' });
      return;
    }
    try {
      const hash = await bcrypt.hash(securityAnswer, 12);
      await pool.execute('CALL spSetSecurityQA(?, ?, ?)', [
        userId,
        securityQuestion,
        hash,
      ]);
      res.json({ message: 'Profile updated' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

export default router;