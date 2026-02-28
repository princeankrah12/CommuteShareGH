import { z } from 'zod';
export declare const createRideSchema: z.ZodObject<{
    body: z.ZodObject<{
        vehicleId: z.ZodString;
        departureTime: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        originLandmarkId: z.ZodString;
        destinationLandmarkId: z.ZodString;
        availableSeats: z.ZodNumber;
        fare: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const searchRideSchema: z.ZodObject<{
    query: z.ZodObject<{
        originId: z.ZodString;
        destinationId: z.ZodString;
        date: z.ZodUnion<[z.ZodString, z.ZodString]>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const bookRideSchema: z.ZodObject<{
    body: z.ZodObject<{
        rideId: z.ZodString;
        pickupLandmarkId: z.ZodString;
        dropoffLandmarkId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=rideSchema.d.ts.map