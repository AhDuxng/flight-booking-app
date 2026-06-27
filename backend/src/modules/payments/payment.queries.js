import supabase from '../../config/supabase.js';

export const createPayment = async (paymentData) => {
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePaymentStatus = async (paymentId, status, updates = {}) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ status, ...updates, updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getPaymentByTransactionRef = async (ref) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('transaction_ref', ref)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const confirmBookingSeats = async (bookingId) => {
  const { error } = await supabase.rpc('confirm_seats', {
    p_booking_id: bookingId
  });
  if (error) throw error;
  return true;
};

export const updateBookingStatus = async (bookingId, status) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
