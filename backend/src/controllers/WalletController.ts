import { Request, Response } from 'express';
import { WalletService } from '../services/WalletService';
import prisma from '../services/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class WalletController {
  static async getBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id; // Use authenticated user ID
      const user = await WalletService.getBalance(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async topUp(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id; // Use authenticated user ID
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const result = await WalletService.initializeTopUp(userId, amount);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async verifyTopUp(req: AuthRequest, res: Response) {
    try {
      const { reference } = req.params;
      const result = await WalletService.verifyTopUp(reference as string);
      res.json({ 
        message: 'Payment verified successfully', 
        status: result.status 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id; // Use authenticated user ID
      const transactions = await WalletService.getTransactions(userId);
      
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getWalletDetails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          commutePoints: true,
          commuteProfile: {
            select: { strikes: true }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        commutePoints: user.commutePoints,
        strikes: user.commuteProfile?.strikes || 0
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
