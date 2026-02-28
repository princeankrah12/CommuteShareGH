export declare class RatingService {
    /**
     * Submit a rating for a user (driver or rider) after a ride
     */
    static submitRating(data: {
        rideId: string;
        raterId: string;
        rateeId: string;
        score: number;
        comment?: string;
        bookingId?: string;
    }): Promise<any>;
    /**
     * Get ratings received by a user
     */
    static getUserRatings(userId: string): Promise<any>;
}
//# sourceMappingURL=RatingService.d.ts.map