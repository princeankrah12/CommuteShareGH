import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import prisma from '../services/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AuthController {
  static async googleLogin(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: 'idToken is required' });
      }
      const result = await AuthService.googleLogin(idToken);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async signup(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);
      const token = AuthService.generateToken(user);
      res.status(201).json({ user, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyGhanaCard(req: AuthRequest, res: Response) {
    try {
      const { ghanaCardId, selfie } = req.body;
      const userId = req.user!.id; // Use authenticated user ID
      const user = await AuthService.verifyGhanaCard(userId, ghanaCardId, selfie);
      res.json({ message: 'Identity verified successfully', user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyWorkEmail(req: AuthRequest, res: Response) {
    try {
      const { workEmail } = req.body;
      const userId = req.user!.id; // Use authenticated user ID
      const user = await AuthService.verifyWorkEmail(userId, workEmail);
      res.json({ message: 'Work email linked successfully', user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getUserProfile(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await AuthService.getUserProfile(userId as string);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
