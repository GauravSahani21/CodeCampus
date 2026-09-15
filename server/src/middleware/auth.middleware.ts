import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; username: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = (req as any).headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string; username: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = (req as any).headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string; username: string };
    req.user = decoded;
  } catch {
    // Ignore invalid/expired token for optional authentication
  }
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const requireInstructor = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'instructor' && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Instructor access required' });
    return;
  }
  next();
};

export const requireAuth = authenticate;
export const optionalAuth = optionalAuthenticate;

