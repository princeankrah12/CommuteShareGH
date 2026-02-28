import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class AuthController {
    static signup(req: Request, res: Response): Promise<void>;
    static verifyGhanaCard(req: AuthRequest, res: Response): Promise<void>;
    static verifyWorkEmail(req: AuthRequest, res: Response): Promise<void>;
    static getCurrentUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=AuthController.d.ts.map