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
      return;
    }

    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authorize: only allow requests where JWT.roles contains at least one of `allowedRoles`
 */
export const authorize = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const user = req.user as JwtPayload | undefined;
    if (!user || !Array.isArray(user.roles) || !user.roles.some(r => allowedRoles.includes(r))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
};
