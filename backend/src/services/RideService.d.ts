export declare class RideService {
    /**
     * Driver cancels the entire ride
     */
    static driverCancelRide(rideId: string): Promise<any>;
    /**
     * Driver cancels a specific rider for lateness (> 5 mins)
     */
    static markRiderAsLate(bookingId: string): Promise<any>;
    /**
     * Create a new scheduled ride (Driver) with multiple stops
     */
    static createRide(data: {
        driverId: string;
        vehicleId: string;
        departureTime: Date;
        landmarkIds: string[];
        availableSeats: number;
        fare: number;
    }): Promise<any>;
    /**
     * Search for rides matching the corridor (any two stops in the correct order)
     */
    static searchRides(originId: string, destinationId: string, date: Date): Promise<any>;
    /**
     * Book a ride
     */
    static bookRide(data: {
        rideId: string;
        riderId: string;
        pickupLandmarkId: string;
        dropoffLandmarkId: string;
    }): Promise<any>;
}
//# sourceMappingURL=RideService.d.ts.map