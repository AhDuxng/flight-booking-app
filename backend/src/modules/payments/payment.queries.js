import { supabase } from '../../config/supabase.js';
import { throwDatabaseError } from '../../utils/error.js';

const PAYMENT_COLUMNS =
  'id, booking_id, user_id, amount, currency, provider, transaction_ref, status, purpose, change_request_id, checkout_url, idempotency_key, booking_price_version, amount_snapshot, currency_snapshot, expires_at, paid_at, created_at, updated_at';

export const getOrCreateIntent = async (payload) => {
  const { data, error } = await supabase.rpc('get_or_create_payment_intent', {
    p_user_id: payload.userId,
    p_booking_id: payload.bookingId,
    p_purpose: payload.purpose,
    p_provider: payload.provider,
    p_idempotency_key: payload.idempotencyKey,
    p_request_hash: payload.requestHash,
    p_transaction_ref: payload.transactionRef,
    p_change_request_id: payload.changeRequestId ?? null,
  });
  throwDatabaseError(error, 'Unable to create payment intent');
  return data;
};

export const expireIntent = async (paymentId, userId) => {
  const { data, error } = await supabase.rpc('expire_payment_intent', {
    p_payment_id: paymentId,
    p_user_id: userId,
  });
  throwDatabaseError(error, 'Unable to expire payment intent');
  return data;
};

export const attachCheckout = async (paymentId, checkoutUrl, rawPayload) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ checkout_url: checkoutUrl, raw_payload: rawPayload, updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .select(PAYMENT_COLUMNS)
    .single();
  throwDatabaseError(error, 'Unable to store checkout session');
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
  const { data, error } = await supabase.rpc('process_payment_webhook_v2', {
    p_provider_event_id: payload.providerEventId,
    p_event_type: payload.eventType,
    p_event_created_at: payload.eventCreatedAt,
    p_booking_id: payload.bookingId,
    p_transaction_ref: payload.transactionRef,
    p_provider: payload.provider,
    p_amount: payload.amount,
    p_currency: payload.currency,
    p_status: payload.status,
    p_raw_body: payload.rawBody,
    p_signature: payload.signature,
    p_payload: payload.rawPayload,
  });

  if (error) {
    throwDatabaseError(error, 'Unable to process payment webhook');
  }

  return data;
};

export const storeFailedWebhook = async (payload, errorMessage) => {
  const { error } = await supabase.from('payment_webhook_logs').upsert({
    booking_id: payload.bookingId,
    provider: payload.provider,
    transaction_ref: payload.transactionRef,
    provider_event_id: payload.providerEventId,
    event_type: payload.eventType,
    event_created_at: payload.eventCreatedAt,
    raw_body: payload.rawBody,
    signature: payload.signature,
    payload: payload.rawPayload,
    processing_status: 'failed',
    error_message: String(errorMessage).slice(0, 1000),
    processed_at: new Date().toISOString(),
  }, { onConflict: 'provider,provider_event_id' });
  throwDatabaseError(error, 'Unable to store failed payment webhook');
};
