export declare class WalletService {
    /**
     * Top up a user's wallet (simulating a successful MoMo payment)
     */
    static topUp(userId: string, amount: number, reference: string): Promise<any>;
    /**
     * Transfer funds from Rider to Driver (Contribution Mode)
     * Includes the platform booking fee and commission logic
     */
    static processRidePayment(riderId: string, driverId: string, fare: number, bookingFee?: number): Promise<any>;
    /**
     * Handle Rotation Mode (Commute Points)
     */
    static processRotationRide(riderId: string, driverId: string): Promise<any>;
    /**
     * Generic deduction for penalties
     */
    static deductPenalty(userId: string, amount: number, description: string): Promise<any>;
    static getBalance(userId: string): Promise<any>;
    static getTransactions(userId: string): Promise<any>;
}
//# sourceMappingURL=WalletService.d.ts.map