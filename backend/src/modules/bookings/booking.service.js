import * as queries from './booking.queries.js';
import supabase from '../../config/supabase.js';

export const createBooking = async (userId, bookingPayload) => {
  const { flight_id, contact_email, contact_phone, notes, discount_code, passengers } = bookingPayload;

  // 1. Get flight detail
  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flight_id)
    .single();

  if (flightError || !flight) {
    const error = new Error('Flight not found');
    error.status = 404;
    throw error;
  }

  if (flight.status !== 'scheduled') {
    const error = new Error(`Flight is not scheduled (current status: ${flight.status})`);
    error.status = 400;
    throw error;
  }

  // 2. Fetch options details in bulk
  const seatIds = passengers.map(p => p.seat_id).filter(Boolean);
  const baggageOptionIds = passengers.map(p => p.baggage_option_id).filter(Boolean);
  const mealOptionIds = passengers.map(p => p.meal_option_id).filter(Boolean);

  let dbSeats = [];
  if (seatIds.length > 0) {
    const { data, error } = await supabase.from('seats').select('*').in('id', seatIds);
    if (error) throw error;
    dbSeats = data;
  }

  let dbBaggageOptions = [];
  if (baggageOptionIds.length > 0) {
    const { data, error } = await supabase.from('baggage_options').select('*').in('id', baggageOptionIds);
    if (error) throw error;
    dbBaggageOptions = data;
  }

  let dbMealOptions = [];
  if (mealOptionIds.length > 0) {
    const { data, error } = await supabase.from('meal_options').select('*').in('id', mealOptionIds);
    if (error) throw error;
    dbMealOptions = data;
  }

  // 3. Create initial pending booking
  const basePriceSnapshot = flight.base_price;
  const initialBooking = await queries.createBooking({
    user_id: userId,
    flight_id,
    price_snapshot: basePriceSnapshot,
    total_price: 0, // Will calculate and update shortly
    status: 'pending',
    contact_email,
    contact_phone: contact_phone || null,
    notes: notes || null
  });

  const bookingId = initialBooking.id;

  // 4. Create passengers
  const passengersInsertPayload = passengers.map(p => ({
    booking_id: bookingId,
    first_name: p.first_name,
    last_name: p.last_name,
    date_of_birth: p.date_of_birth,
    gender: p.gender,
    nationality: p.nationality,
    passport_number: p.passport_number || null,
    passenger_type: p.passenger_type || 'adult'
  }));

  const insertedPassengers = await queries.createPassengers(passengersInsertPayload);

  // 5. Correlate inputs to database passenger rows and handle seat/baggage/meals
  const bookingSeatsPayload = [];
  const bookingBaggagePayload = [];
  const bookingMealsPayload = [];
  let seatCost = 0;
  let baggageCost = 0;
  let mealCost = 0;

  for (let i = 0; i < passengers.length; i++) {
    const inputPassenger = passengers[i];
    
    // Find inserted passenger
    const dbPassenger = insertedPassengers.find(
      dp => dp.first_name === inputPassenger.first_name && dp.last_name === inputPassenger.last_name
    ) || insertedPassengers[i];

    const passengerId = dbPassenger.id;

    // A. Hold seat
    if (inputPassenger.seat_id) {
      const seat = dbSeats.find(s => s.id === inputPassenger.seat_id);
      if (!seat) {
        throw new Error(`Seat ID ${inputPassenger.seat_id} not found`);
      }
      if (seat.status !== 'available') {
        throw new Error(`Seat ${seat.seat_number} is already ${seat.status}`);
      }

      await queries.holdSeat(seat.id, bookingId);
      
      bookingSeatsPayload.push({
        booking_id: bookingId,
        passenger_id: passengerId,
        seat_id: seat.id
      });
      seatCost += Number(seat.price);
    }

    // B. Baggage
    if (inputPassenger.baggage_option_id) {
      const baggageOpt = dbBaggageOptions.find(b => b.id === inputPassenger.baggage_option_id);
      if (!baggageOpt) {
        throw new Error(`Baggage option ID ${inputPassenger.baggage_option_id} not found`);
      }
      const qty = inputPassenger.baggage_quantity || 1;
      bookingBaggagePayload.push({
        booking_id: bookingId,
        passenger_id: passengerId,
        baggage_option_id: baggageOpt.id,
        quantity: qty,
        price_snapshot: baggageOpt.price
      });
      baggageCost += Number(baggageOpt.price) * qty;
    }

    // C. Meal
    if (inputPassenger.meal_option_id) {
      const mealOpt = dbMealOptions.find(m => m.id === inputPassenger.meal_option_id);
      if (!mealOpt) {
        throw new Error(`Meal option ID ${inputPassenger.meal_option_id} not found`);
      }
      const qty = inputPassenger.meal_quantity || 1;
      bookingMealsPayload.push({
        booking_id: bookingId,
        passenger_id: passengerId,
        meal_option_id: mealOpt.id,
        quantity: qty,
        price_snapshot: mealOpt.price
      });
      mealCost += Number(mealOpt.price) * qty;
    }
  }

  // 6. Bulk insert dependencies
  if (bookingSeatsPayload.length > 0) {
    await queries.linkBookingSeats(bookingSeatsPayload);
  }
  if (bookingBaggagePayload.length > 0) {
    await queries.addBookingBaggage(bookingBaggagePayload);
  }
  if (bookingMealsPayload.length > 0) {
    await queries.addBookingMeals(bookingMealsPayload);
  }

  // 7. Calculate total cost
  const ticketBaseCost = Number(flight.base_price) * passengers.length;
  let rawTotalCost = ticketBaseCost + seatCost + baggageCost + mealCost;
  let finalTotalCost = rawTotalCost;

  // 8. Apply discount code if applicable
  if (discount_code) {
    try {
      const discountResult = await queries.applyDiscountRpc(discount_code, rawTotalCost);
      if (discountResult && discountResult.length > 0) {
        const { discount_id, discount_amount } = discountResult[0];
        finalTotalCost = Math.max(0, rawTotalCost - Number(discount_amount));

        await queries.addBookingDiscount({
          booking_id: bookingId,
          discount_id: discount_id,
          discount_amount: discount_amount
        });

        await queries.incrementDiscountUsedCount(discount_id);
      }
    } catch (err) {
      // Log error but proceed without discount (or we could throw, let's throw to be strict)
      throw new Error(`Failed to apply discount: ${err.message}`);
    }
  }

  // 9. Update final prices in database
  const updatedBooking = await queries.updateBookingPrices(bookingId, basePriceSnapshot, finalTotalCost);

  // 10. Decrease available seats in flight
  const newAvailableSeats = Math.max(0, flight.available_seats - passengers.length);
  await supabase
    .from('flights')
    .update({ available_seats: newAvailableSeats })
    .eq('id', flight_id);

  // 11. Retrieve and return populated booking details
  return await queries.getBookingDetailsById(bookingId);
};

export const getBookingsByUserId = async (userId) => {
  return await queries.getBookingsByUserId(userId);
};

export const getBookingDetailsById = async (userId, userRole, bookingId) => {
  const booking = await queries.getBookingDetailsById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  // Authorize: user can only see their own booking (admins can see any)
  if (userRole !== 'admin' && booking.user_id !== userId) {
    const error = new Error('Forbidden: You do not have access to this booking');
    error.status = 403;
    throw error;
  }

  return booking;
};

export const cancelBooking = async (userId, userRole, bookingId) => {
  const booking = await queries.getBookingDetailsById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  if (userRole !== 'admin' && booking.user_id !== userId) {
    const error = new Error('Forbidden: You do not have access to this booking');
    error.status = 403;
    throw error;
  }

  if (booking.status === 'cancelled' || booking.status === 'refunded') {
    const error = new Error(`Booking is already ${booking.status}`);
    error.status = 400;
    throw error;
  }

  // Cancel booking (this releases seats in DB)
  const result = await queries.cancelBooking(bookingId);

  // Restore flight available seats
  const { data: flight } = await supabase.from('flights').select('available_seats').eq('id', booking.flight_id).single();
  if (flight) {
    await supabase
      .from('flights')
      .update({ available_seats: flight.available_seats + booking.passengers.length })
      .eq('id', booking.flight_id);
  }

  return result;
};
