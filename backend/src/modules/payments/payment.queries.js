import { supabase } from '../../config/supabase.js';
import { createHttpError, throwDatabaseError } from '../../utils/error.js';

const PAYMENT_COLUMNS =
  'id, booking_id, amount, currency, provider, transaction_ref, status, paid_at, created_at, updated_at';

export const findPendingByBookingId = async (bookingId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('booking_id', bookingId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load payment');
  return data;
};

export const insertIntent = async (payload) => {
  const { data, error } = await supabase
    .from('payments')
    .insert(payload)
    .select(PAYMENT_COLUMNS)
    .single();

  throwDatabaseError(error, 'Unable to create payment');
  return data;
};

export const findByBookingId = async (bookingId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  throwDatabaseError(error, 'Unable to load payments');
  return data;
};

export const findByReference = async (bookingId, transactionRef) => {
  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_COLUMNS)
    .eq('booking_id', bookingId)
    .eq('transaction_ref', transactionRef)
    .maybeSingle();

  throwDatabaseError(error, 'Unable to load payment');
  return data;
};

export const processWebhook = async (payload) => {
  const { data, error } = await supabase.rpc('process_payment_webhook', {
    p_booking_id: payload.bookingId,
    p_transaction_ref: payload.transactionRef,
    p_provider: payload.provider,
    p_amount: payload.amount,
    p_status: payload.status,
    p_raw_payload: payload.rawPayload,
  });

  if (error) {
    throw createHttpError(400, 'Unable to process payment webhook');
  }

  return data;
};

// Bài toán 3 - Distributed Transaction: lưu raw webhook trước transaction để còn dữ liệu đối soát khi provider hoặc database lỗi.
export const insertWebhookLog = async (payload) => {
  const { data, error } = await supabase
    .from('payment_webhook_logs')
    .insert({
      booking_id: payload.bookingId,
      provider: payload.provider,
      transaction_ref: payload.transactionRef,
      payload: payload.rawPayload,
    })
    .select('id')
    .single();

  throwDatabaseError(error, 'Unable to store payment webhook log');
  return data;
};

// Bài toán 3 - Distributed Transaction: đánh dấu kết quả xử lý để worker/nhân viên có thể retry hoặc hoàn tiền bù trừ.
export const updateWebhookLog = async (logId, result, errorMessage = null) => {
  const { error } = await supabase
    .from('payment_webhook_logs')
    .update({
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
      processing_result: result,
    })
    .eq('id', logId);

  throwDatabaseError(error, 'Unable to update payment webhook log');
};
