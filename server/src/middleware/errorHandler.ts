import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    res.status(400).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values((err as any).errors).map((e: any) => e.message);
    res.status(400).json({ success: false, message: messages[0] || 'Validation failed' });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token.' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token has expired. Please log in again.' });
    return;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong.' : message,
  });
};
