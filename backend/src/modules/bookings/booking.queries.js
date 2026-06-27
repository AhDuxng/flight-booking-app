import supabase from '../../config/supabase.js';

export const createBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createPassengers = async (passengersData) => {
  const { data, error } = await supabase
    .from('passengers')
    .insert(passengersData)
    .select();
  if (error) throw error;
  return data;
};

export const holdSeat = async (seatId, bookingId) => {
  const { error } = await supabase.rpc('hold_seat', {
    p_seat_id: seatId,
    p_booking_id: bookingId
  });
  if (error) throw error;
  return true;
};

export const linkBookingSeats = async (bookingSeats) => {
  const { data, error } = await supabase
    .from('booking_seats')
    .insert(bookingSeats)
    .select();
  if (error) throw error;
  return data;
};

export const addBookingBaggage = async (bookingBaggage) => {
  const { data, error } = await supabase
    .from('booking_baggage')
    .insert(bookingBaggage)
    .select();
  if (error) throw error;
  return data;
};

export const addBookingMeals = async (bookingMeals) => {
  const { data, error } = await supabase
    .from('booking_meals')
    .insert(bookingMeals)
    .select();
  if (error) throw error;
  return data;
};

export const applyDiscountRpc = async (code, orderValue) => {
  const { data, error } = await supabase.rpc('apply_discount', {
    p_code: code,
    p_order_value: orderValue
  });
  if (error) throw error;
  return data;
};

export const addBookingDiscount = async (bookingDiscount) => {
  const { data, error } = await supabase
    .from('booking_discounts')
    .insert(bookingDiscount)
    .select();
  if (error) throw error;
  return data;
};

export const incrementDiscountUsedCount = async (discountId) => {
  const { data: discount } = await supabase
    .from('discounts')
    .select('used_count')
    .eq('id', discountId)
    .single();

  if (discount) {
    await supabase
      .from('discounts')
      .update({ used_count: (discount.used_count || 0) + 1 })
      .eq('id', discountId);
  }
};

export const updateBookingPrices = async (bookingId, priceSnapshot, totalPrice) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ price_snapshot: priceSnapshot, total_price: totalPrice })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getBookingsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights(
        *,
        airline:airlines(name, code, logo_url),
        origin_airport:airports!origin_airport_id(name, city, country, code),
        destination_airport:airports!destination_airport_id(name, city, country, code)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getBookingDetailsById = async (bookingId) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights(
        *,
        airline:airlines(name, code, logo_url),
        origin_airport:airports!origin_airport_id(name, city, country, code),
        destination_airport:airports!destination_airport_id(name, city, country, code)
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const { data: passengers } = await supabase
    .from('passengers')
    .select('*')
    .eq('booking_id', bookingId);

  const { data: bookingSeats } = await supabase
    .from('booking_seats')
    .select('*, seat:seats(*)')
    .eq('booking_id', bookingId);

  const { data: bookingBaggage } = await supabase
    .from('booking_baggage')
    .select('*, baggage_option:baggage_options(*)')
    .eq('booking_id', bookingId);

  const { data: bookingMeals } = await supabase
    .from('booking_meals')
    .select('*, meal_option:meal_options(*)')
    .eq('booking_id', bookingId);

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId);

  const { data: bookingDiscounts } = await supabase
    .from('booking_discounts')
    .select('*, discount:discounts(*)')
    .eq('booking_id', bookingId);

  return {
    ...booking,
    passengers,
    booking_seats: bookingSeats,
    booking_baggage: bookingBaggage,
    booking_meals: bookingMeals,
    payments,
    booking_discounts: bookingDiscounts
  };
};

export const cancelBooking = async (bookingId) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('seats')
    .update({ status: 'available', booking_id: null })
    .eq('booking_id', bookingId);

  return data;
};
