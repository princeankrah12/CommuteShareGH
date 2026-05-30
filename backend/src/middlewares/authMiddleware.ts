import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // Demo/Mock Token Support (Development Only)
  if (process.env.NODE_ENV !== 'production' && token === 'mock-jwt-token') {
    const mockId = 'u1';
    const mockEmail = 'kojo@example.com';

    // Upsert the mock user to ensure database operations (like KYC) don't fail
    const user = await prisma.user.upsert({
      where: { id: mockId },
      update: {},
      create: {
        id: mockId,
        email: mockEmail,
        fullName: 'Kojo Mensah',
        phoneNumber: '0244000000',
        referralCode: 'MOCK-DEMO',
        isVerified: false,
      }
    });

    req.user = { id: user.id, email: user.email };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    
    try {
      // Optional: Verify user still exists in DB
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true }
      });

      if (user) {
        req.user = user;
        return next();
      }
    } catch (dbError) {
      console.warn('Auth DB check failed, continuing with decoded payload');
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
