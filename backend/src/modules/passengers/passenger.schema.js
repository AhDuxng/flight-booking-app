import { z } from 'zod';

export const passengerBookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});
