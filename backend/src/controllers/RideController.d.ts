import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class RideController {
    static create(req: AuthRequest, res: Response): Promise<void>;
    static search(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static book(req: AuthRequest, res: Response): Promise<void>;
    static cancelRide(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static markLate(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static rateRide(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=RideController.d.ts.map