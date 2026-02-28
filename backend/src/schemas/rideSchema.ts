import { z } from 'zod';

export const createRideSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid(),
    departureTime: z.string().datetime().or(z.date()),
    originLandmarkId: z.string().uuid(),
    destinationLandmarkId: z.string().uuid(),
    availableSeats: z.number().int().positive(),
    fare: z.number().positive(),
  }),
});

export const searchRideSchema = z.object({
  query: z.object({
    originId: z.string(),
    destinationId: z.string(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    affinityGroupId: z.string().optional(),
  }),
});

export const bookRideSchema = z.object({
  body: z.object({
    rideId: z.string().uuid(),
    pickupLandmarkId: z.string().uuid(),
    dropoffLandmarkId: z.string().uuid(),
  }),
});
