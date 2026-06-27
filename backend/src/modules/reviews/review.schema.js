import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    booking_id: z.string().uuid('Invalid booking ID'),
    flight_id: z.string().uuid('Invalid flight ID'),
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    comment: z.string().optional()
  })
});

export const getReviewsSchema = z.object({
  query: z.object({
    flight_id: z.string().uuid('Invalid flight ID')
  })
});
