import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate, JwtPayload } from '../middleware/auth';

const router = Router();

/**
 * GET /api/items
 * Returns all items belonging to the authenticated user.
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response) => {
    // Cast req.user to our JwtPayload interface
    const user = req.user as JwtPayload;
    // Call the stored procedure and grab the first result set
    const [rows]: any = await pool.execute('CALL spGetItemsForUser(?)', [user.id]);
    const items = rows[0];
    return res.json(items);
  }
);

export default router;
