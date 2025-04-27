import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  username: string;
  roles: string[];
}

export const authenticate: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing or malformed token' });
      return;                  // ← returns *void*, not Response
    }

    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; roles: string[] };

    next();                     // hand control to the next middleware/route
  } catch (err) {
    next(err);                  // let Express deal with the error
  }
};