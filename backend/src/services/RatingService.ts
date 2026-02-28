import prisma from './prisma';

export class RatingService {
  /**
   * Submit a rating for a user (driver or rider) after a ride
   */
  static async submitRating(data: {
    rideId: string;
    raterId: string;
    rateeId: string;
    score: number;
    comment?: string;
    bookingId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create the rating
      const rating = await tx.rating.create({
        data: {
          rideId: data.rideId,
          raterId: data.raterId,
          rateeId: data.rateeId,
          score: data.score,
          comment: data.comment,
        },
      });

      // 2. Mark booking as rated if bookingId is provided
      if (data.bookingId) {
        await tx.rideBooking.update({
          where: { id: data.bookingId },
          data: { isRated: true },
        });
      }

      // 3. Recalculate trustScore for the ratee
      const allRatings = await tx.rating.findMany({
        where: { rateeId: data.rateeId },
        select: { score: true },
      });

      const totalScore = allRatings.reduce((sum, r) => sum + r.score, 0);
      const averageScore = totalScore / allRatings.length;

      // Update user's trust score
      await tx.user.update({
        where: { id: data.rateeId },
        data: { trustScore: averageScore },
      });

      return rating;
    });
  }

  /**
   * Get ratings received by a user
   */
  static async getUserRatings(userId: string) {
    return await prisma.rating.findMany({
      where: { rateeId: userId },
      include: {
        rater: {
          select: { fullName: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
