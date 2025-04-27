import 'express-serve-static-core';
import { JwtPayload } from '../middleware/auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}