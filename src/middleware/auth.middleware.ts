import { Request, Response, NextFunction } from 'express';
import { findUserByToken } from '../services/user.service';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authorization header with Bearer token is required',
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
    return;
  }

  const user = await findUserByToken(token);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  req.user = user;
  next();
};
