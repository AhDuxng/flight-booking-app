import * as queries from './payment.queries.js';
import supabase from '../../config/supabase.js';

export const processPayment = async (userId, { booking_id, provider, amount }) => {
  // 1. Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (bookingError || !booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  // Check ownership
  if (booking.user_id !== userId) {
    const error = new Error('Forbidden: You do not own this booking');
    error.status = 403;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error(`Booking is already in ${booking.status} status`);
    error.status = 400;
    throw error;
  }

  // 2. Create pending payment record
  const transactionRef = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const payment = await queries.createPayment({
    booking_id,
    amount,
    currency: 'VND',
    provider,
    status: 'pending',
    transaction_ref: transactionRef
  });

  // 3. Process payment. For mock payments, we simulate success.
  let redirectUrl = null;
  if (provider === 'cash') {
    await queries.updatePaymentStatus(payment.id, 'success', {
      paid_at: new Date().toISOString(),
      raw_payload: { message: 'Cash payment processed instantly' }
    });

    await queries.updateBookingStatus(booking_id, 'confirmed');
    await queries.confirmBookingSeats(booking_id);

    // Create a notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'payment_success',
      title: 'Thanh toán thành công',
      body: `Thanh toán thành công cho mã đặt chỗ ${booking_id}. Vé của bạn đã được xác nhận.`,
      payload: { booking_id }
    });
  } else {
    // For online gateways, we return a mock redirect URL that will direct the user back
    redirectUrl = `/api/v1/payments/mock-redirect?paymentId=${payment.id}&bookingId=${booking_id}&amount=${amount}&ref=${transactionRef}`;
  }

  return {
    payment: {
      id: payment.id,
      status: payment.status,
      transaction_ref: transactionRef
    },
    redirectUrl
  };
};

export const handlePaymentWebhook = async (payload) => {
  const { paymentId, status } = payload;
  const { data: payment, error } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (error || !payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'pending') {
    return payment;
  }

  const updatedPayment = await queries.updatePaymentStatus(payment.id, status, {
    paid_at: status === 'success' ? new Date().toISOString() : null,
    raw_payload: payload
  });

  if (status === 'success') {
    await queries.updateBookingStatus(payment.booking_id, 'confirmed');
    await queries.confirmBookingSeats(payment.booking_id);

    const { data: booking } = await supabase.from('bookings').select('user_id').eq('id', payment.booking_id).single();
    if (booking) {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'payment_success',
        title: 'Thanh toán thành công',
        body: `Thanh toán thành công cho mã đặt chỗ ${payment.booking_id}. Vé của bạn đã được xác nhận.`,
        payload: { booking_id: payment.booking_id }
      });
    }
  } else {
    await queries.updateBookingStatus(payment.booking_id, 'pending');
  }

  return updatedPayment;
};
