import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId?: string;
}

// Optional auth middleware - extracts user if token exists, but doesn't reject if missing
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // No token provided, continue without authentication
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (err) {
    // Invalid token, continue without authentication
    next();
  }
};

export default optionalAuth;
