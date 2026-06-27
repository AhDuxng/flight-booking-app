import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    flight_id: z.string().uuid('Invalid flight ID'),
    contact_email: z.string().email('Invalid contact email'),
    contact_phone: z.string().optional(),
    notes: z.string().optional(),
    discount_code: z.string().optional(),
    passengers: z.array(
      z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
        date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
        gender: z.enum(['male', 'female', 'other']),
        nationality: z.string().min(1, 'Nationality is required'),
        passport_number: z.string().optional(),
        passenger_type: z.enum(['adult', 'child', 'infant']).default('adult'),
        
        // Optional selections
        seat_id: z.string().uuid('Invalid seat ID').optional(),
        baggage_option_id: z.string().uuid('Invalid baggage option ID').optional(),
        baggage_quantity: z.number().int().min(1).max(5).optional(),
        meal_option_id: z.string().uuid('Invalid meal option ID').optional(),
        meal_quantity: z.number().int().min(1).optional()
      })
    ).min(1, 'At least one passenger is required')
  })
});

export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID')
  })
});
