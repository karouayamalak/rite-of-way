import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { User } from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'admin' | 'customer';
        name: string;
        email: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded: JwtPayload = verifyToken(token);

    // Verify user still exists
    const user = await User.findById(decoded.userId).select('name email role isVerified');
    if (!user) {
      res.status(401).json({ success: false, message: 'User no longer exists.' });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
      return;
    }
    next();
  });
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('name email role');
      if (user) {
        req.user = {
          userId: user._id.toString(),
          role: user.role,
          name: user.name,
          email: user.email,
        };
      }
    }
  } catch {
    // Ignore auth errors for optional auth routes
  }
  next();
};
