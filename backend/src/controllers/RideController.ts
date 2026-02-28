import { Request, Response } from 'express';
import { RideService } from '../services/RideService';
import { RatingService } from '../services/RatingService';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../services/prisma';

import { AddressService } from '../utils/AddressService';

export class RideController {
  static async resolveAddress(req: Request, res: Response) {
    try {
      const { digitalAddress } = req.body;
      if (!digitalAddress) return res.status(400).json({ error: 'digitalAddress is required' });
      
      const coords = await AddressService.resolveDigitalAddress(digitalAddress);
      res.json(coords);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user!.id; // Use authenticated user ID
      const { 
        vehicleId, departureTime, 
        originLandmarkId, destinationLandmarkId, 
        availableSeats, fare 
      } = req.body;

      const ride = await RideService.createRide({
        driverId,
        vehicleId,
        departureTime: new Date(departureTime),
        landmarkIds: [originLandmarkId, destinationLandmarkId],
        availableSeats,
        fare
      });

      res.status(201).json(ride);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async search(req: AuthRequest, res: Response) {
    try {
      const { originId, destinationId, date, affinityGroupId } = req.query;

      if (!originId || !destinationId || !date) {
        return res.status(400).json({ error: 'originId, destinationId, and date are required' });
      }

      const rides = await RideService.searchRides(
        originId as string,
        destinationId as string,
        new Date(date as string),
        affinityGroupId as string
      );

      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async book(req: AuthRequest, res: Response) {
    try {
      const riderId = req.user!.id; // Use authenticated user ID
      const { rideId, pickupLandmarkId, dropoffLandmarkId } = req.body;

      const booking = await RideService.bookRide({
        rideId,
        riderId,
        pickupLandmarkId,
        dropoffLandmarkId
      });

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelRide(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const userId = req.user!.id;

      // Verify ownership before cancellation
      const ride = await prisma.ride.findUnique({ where: { id: rideId as string } });
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      if (ride.driverId !== userId) return res.status(403).json({ error: 'Unauthorized to cancel this ride' });

      const result = await RideService.driverCancelRide(rideId as string);
      res.json({ message: 'Ride cancelled', result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async markLate(req: AuthRequest, res: Response) {
    try {
      const { bookingId } = req.body;
      const userId = req.user!.id;

      // Verify that the requester is the driver for this booking
      const booking = await prisma.rideBooking.findUnique({
        where: { id: bookingId },
        include: { ride: true }
      });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      if (booking.ride.driverId !== userId) return res.status(403).json({ error: 'Unauthorized' });

      const result = await RideService.markRiderAsLate(bookingId);
      res.json({ message: 'Rider marked as late and charged full fare', result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async rateRide(req: AuthRequest, res: Response) {
    try {
      const raterId = req.user!.id; // Use authenticated user ID
      const { rideId, rateeId, score, comment, bookingId } = req.body;
      
      if (!rideId || !rateeId || !score) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const rating = await RatingService.submitRating({
        rideId,
        raterId,
        rateeId,
        score,
        comment,
        bookingId,
      });

      res.status(201).json(rating);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
