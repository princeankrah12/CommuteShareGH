export declare class AuthService {
    /**
     * Register a new user with basic info and referral support
     */
    static register(data: any): Promise<any>;
    /**
     * Mock Ghana Card Verification API
     */
    static verifyGhanaCard(userId: string, ghanaCardId: string): Promise<any>;
    /**
     * Verify Corporate/Work Email
     */
    static verifyWorkEmail(userId: string, workEmail: string): Promise<any>;
    static generateToken(user: any): string;
    static getUserProfile(userId: string): Promise<any>;
}
//# sourceMappingURL=AuthService.d.ts.map