import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * Middleware to set CSRF token cookie
 * Uses Double Submit Cookie pattern for CSRF protection
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if CSRF token cookie already exists
    if (!req.cookies?.['XSRF-TOKEN']) {
      // Generate new CSRF token
      const csrfToken = randomBytes(32).toString('hex');

      // Set cookie with secure options
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false, // Must be false so JavaScript can read it
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // Prevent CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });
    }

    next();
  }
}
