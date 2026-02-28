import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class WalletController {
    static getBalance(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static topUp(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getTransactions(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=WalletController.d.ts.map