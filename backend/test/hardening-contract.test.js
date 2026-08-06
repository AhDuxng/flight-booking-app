import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { hashRequest, normalizeIdempotencyKey, stableStringify } from '../src/utils/idempotency.js';
import { paymentWebhookSchema } from '../src/modules/payments/payment.schema.js';
import { isWebhookTimestampFresh, verifyWebhookHmac } from '../src/utils/webhook.js';
import {
  buildVnpayPaymentUrl,
  buildVnpayQueryRequest,
  buildVnpayRefundRequest,
  canonicalizeVnpayParams,
  classifyVnpayRefundResponse,
  createVnpaySecureHash,
  formatVnpayDate,
  normalizeVnpayIp,
  verifyVnpaySignature,
  verifyVnpayApiResponse,
} from '../src/modules/payments/vnpay.gateway.js';
import { resolveFrontendOrigins } from '../src/config/frontendOrigins.js';
import { isSupabaseServerKey } from '../src/config/supabaseKey.js';

const FIRST_UUID = '11111111-1111-4111-8111-111111111111';

const migrationUrl = new URL(
  '../database/migrations/20260802000000_harden_core_transactions.sql',
  import.meta.url,
);
const flightSearchMigrationUrl = new URL(
  '../database/migrations/20260806010000_optimize_flight_number_search.sql',
  import.meta.url,
);
const lifecycleMigrationUrl = new URL(
  '../database/migrations/20260806020000_complete_booking_lifecycle.sql',
  import.meta.url,
);
const checkoutMigrationUrl = new URL(
  '../database/migrations/20260806030000_fix_booking_checkout.sql',
  import.meta.url,
);
const bookingReferenceMigrationUrl = new URL(
  '../database/migrations/20260806040000_fix_booking_reference_generation.sql',
  import.meta.url,
);

test('request hashing is deterministic and rejects unsafe idempotency keys', () => {
  assert.equal(stableStringify({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.equal(hashRequest({ b: 2, a: 1 }), hashRequest({ a: 1, b: 2 }));
  assert.equal(normalizeIdempotencyKey('checkout:abc-123'), 'checkout:abc-123');
  assert.throws(() => normalizeIdempotencyKey('short', { required: true }));
});

test('production OAuth redirects never select a loopback frontend origin', () => {
  const production = resolveFrontendOrigins({
    configuredOrigins: ['http://localhost:5173'],
    productionOrigins: ['https://vietfly.netlify.app'],
    nodeEnv: 'production',
  });
  assert.equal(production.frontendUrl, 'https://vietfly.netlify.app');
  assert.deepEqual(production.corsOrigins, ['https://vietfly.netlify.app']);

  const development = resolveFrontendOrigins({
    configuredOrigins: ['http://localhost:5173'],
    productionOrigins: ['https://vietfly.netlify.app'],
    nodeEnv: 'development',
  });
  assert.equal(development.frontendUrl, 'http://localhost:5173');
});

test('backend rejects Supabase anon and publishable keys for server operations', () => {
  const jwt = (role) =>
    [
      Buffer.from('{}').toString('base64url'),
      Buffer.from(JSON.stringify({ role })).toString('base64url'),
      'signature',
    ].join('.');

  assert.equal(isSupabaseServerKey(jwt('service_role')), true);
  assert.equal(isSupabaseServerKey(jwt('anon')), false);
  assert.equal(isSupabaseServerKey('sb_secret_server-key'), true);
  assert.equal(isSupabaseServerKey('sb_publishable_browser-key'), false);
});

test('normalized payment webhooks require currency and event identity', () => {
  assert.equal(
    paymentWebhookSchema.safeParse({
      bookingId: '11111111-1111-4111-8111-111111111111',
      transactionRef: 'payment-1',
      provider: 'vnpay',
      amount: 100000,
      currency: 'vnd',
      status: 'success',
      eventType: 'payment.succeeded',
    }).success,
    true,
  );
  assert.equal(
    paymentWebhookSchema.safeParse({
      bookingId: '11111111-1111-4111-8111-111111111111',
      transactionRef: 'payment-1',
      provider: 'vnpay',
      amount: 100000,
      status: 'success',
    }).success,
    false,
  );
  assert.equal(
    paymentWebhookSchema.safeParse({
      bookingId: '11111111-1111-4111-8111-111111111111',
      transactionRef: 'payment-1',
      provider: 'vnpay',
      amount: 100000,
      currency: 'VND',
      status: 'success',
      eventType: 'payment.failed',
    }).success,
    false,
  );
  assert.equal(
    paymentWebhookSchema.safeParse({
      bookingId: '11111111-1111-4111-8111-111111111111',
      transactionRef: 'payment-1',
      provider: 'vnpay',
      amount: 100000,
      currency: 'VND',
      status: 'success',
      eventType: 'provider.unknown',
    }).success,
    false,
  );
});

test('webhook HMAC is calculated from exact raw bytes', () => {
  const timestamp = '1785632400';
  const rawBody = '{"amount":100000,"currency":"VND"}';
  const signature = createHmac('sha256', 'test-secret')
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  assert.equal(verifyWebhookHmac({ secret: 'test-secret', timestamp, rawBody, signature }), true);
  assert.equal(
    verifyWebhookHmac({
      secret: 'test-secret',
      timestamp,
      rawBody: '{"currency":"VND","amount":100000}',
      signature,
    }),
    false,
  );
});

test('webhook replay window accepts fresh events and rejects stale events', () => {
  const now = Date.UTC(2026, 7, 2, 10, 0, 0);
  assert.equal(isWebhookTimestampFresh(String(now / 1000 - 120), now, 300), true);
  assert.equal(isWebhookTimestampFresh(String(now / 1000 - 301), now, 300), false);
  assert.equal(isWebhookTimestampFresh('invalid', now, 300), false);
});

test('VNPAY 2.1.0 URLs use sorted RFC1738-style data and HMAC-SHA512', () => {
  const hashSecret = 'sandbox-test-secret';
  const now = new Date('2026-08-05T00:01:02.000Z');
  const { checkoutUrl, requestPayload } = buildVnpayPaymentUrl({
    payment: {
      amount_snapshot: 1250000,
      transaction_ref: 'VF11111111111141118111111111111111',
      expires_at: '2026-08-05T00:11:02.000Z',
    },
    clientIp: '::ffff:203.0.113.10',
    config: {
      tmnCode: 'Y8KALF3L',
      hashSecret,
      payUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: 'https://example.com/api/payments/vnpay/return',
    },
    now,
  });

  const url = new URL(checkoutUrl);
  const params = Object.fromEntries(url.searchParams);
  assert.equal(requestPayload.vnp_Amount, '125000000');
  assert.equal(requestPayload.vnp_CreateDate, '20260805070102');
  assert.equal(requestPayload.vnp_IpAddr, '203.0.113.10');
  assert.equal(verifyVnpaySignature(params, hashSecret).isValid, true);
  assert.equal(
    verifyVnpaySignature({ ...params, vnp_Amount: '125000001' }, hashSecret).isValid,
    false,
  );
});

test('VNPAY canonicalization is stable and excludes signature fields', () => {
  const canonical = canonicalizeVnpayParams({
    vnp_TxnRef: 'VF123',
    vnp_OrderInfo: 'Thanh toan ve may bay',
    vnp_Amount: '100000',
    vnp_SecureHash: 'ignored',
  });
  assert.equal(canonical, 'vnp_Amount=100000&vnp_OrderInfo=Thanh+toan+ve+may+bay&vnp_TxnRef=VF123');
  assert.equal(createVnpaySecureHash(canonical, 'secret').length, 128);
  assert.equal(formatVnpayDate(new Date('2026-08-05T17:00:00.000Z')), '20260806000000');
  assert.equal(normalizeVnpayIp('::1'), '127.0.0.1');
});

test('VNPAY refund requests use the documented signed field order', () => {
  const hashSecret = 'sandbox-test-secret';
  const { checksumData, payload } = buildVnpayRefundRequest({
    refund: {
      id: '11111111-1111-4111-8111-111111111111',
      booking_id: FIRST_UUID,
      approved_amount: 500000,
      booking: { booking_reference: 'ABC123' },
      payment: {
        amount_snapshot: 1000000,
        transaction_ref: 'VF123',
        raw_payload: {
          vnp_TransactionNo: '14567890',
          vnp_OriginalCreateDate: '20260805070102',
        },
      },
    },
    config: {
      tmnCode: 'Y8KALF3L',
      hashSecret,
      apiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    },
    now: new Date('2026-08-05T01:01:02.000Z'),
    ipAddress: '203.0.113.10',
  });
  assert.equal(payload.vnp_TransactionType, '03');
  assert.equal(payload.vnp_Amount, '50000000');
  assert.equal(payload.vnp_TransactionDate, '20260805070102');
  assert.equal(payload.vnp_SecureHash, createVnpaySecureHash(checksumData, hashSecret));

  const response = {
    vnp_ResponseId: 'response123',
    vnp_Command: 'refund',
    vnp_ResponseCode: '00',
    vnp_Message: 'Success',
    vnp_TmnCode: 'Y8KALF3L',
    vnp_TxnRef: 'VF123',
    vnp_Amount: '50000000',
    vnp_BankCode: 'NCB',
    vnp_PayDate: '20260805080203',
    vnp_TransactionNo: '14567891',
    vnp_TransactionType: '03',
    vnp_TransactionStatus: '00',
    vnp_OrderInfo: 'Hoan tien dat cho ABC123',
  };
  const responseData = [
    response.vnp_ResponseId,
    response.vnp_Command,
    response.vnp_ResponseCode,
    response.vnp_Message,
    response.vnp_TmnCode,
    response.vnp_TxnRef,
    response.vnp_Amount,
    response.vnp_BankCode,
    response.vnp_PayDate,
    response.vnp_TransactionNo,
    response.vnp_TransactionType,
    response.vnp_TransactionStatus,
    response.vnp_OrderInfo,
  ].join('|');
  response.vnp_SecureHash = createVnpaySecureHash(responseData, hashSecret);
  assert.equal(verifyVnpayApiResponse(response, hashSecret), true);
  assert.equal(classifyVnpayRefundResponse(response), 'succeeded');
  assert.equal(classifyVnpayRefundResponse({ vnp_ResponseCode: '94' }), 'processing');

  const query = buildVnpayQueryRequest({
    payment: {
      transaction_ref: 'VF123',
      raw_payload: {
        vnp_TransactionNo: '14567890',
        vnp_OriginalCreateDate: '20260805070102',
      },
    },
    requestId: '22222222-2222-4222-8222-222222222222',
    config: {
      tmnCode: 'Y8KALF3L',
      hashSecret,
      apiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    },
    now: new Date('2026-08-05T01:01:02.000Z'),
    ipAddress: '203.0.113.10',
  });
  assert.equal(query.payload.vnp_Command, 'querydr');
  assert.equal(query.payload.vnp_SecureHash, createVnpaySecureHash(query.checksumData, hashSecret));
});

test('lifecycle migration makes group check-in atomic and refund rejection terminal', async () => {
  const sql = await readFile(lifecycleMigrationUrl, 'utf8');
  assert.match(sql, /check_in_booking_v2/);
  assert.match(sql, /expire_flight_change_quote_v2/);
  assert.match(sql, /expire_stale_flight_change_quotes_v2/);
  assert.match(sql, /MANDATORY_REFUND_CANNOT_BE_REJECTED/);
  assert.match(sql, /purpose IN \('booking','flight_change'\)/);
  assert.match(sql, /v_fee_remaining/);
  assert.match(sql, /DROP INDEX IF EXISTS public\.uq_open_refund_per_payment/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.complete_refund_v2/);
  assert.match(sql, /UPDATE public\.payments SET status='success'/);
  assert.match(sql, /Seats are the inventory source of truth/);
  assert.match(sql, /TO service_role/);
});

test('checkout migration applies discounts once after fare pricing', async () => {
  const sql = await readFile(checkoutMigrationUrl, 'utf8');
  assert.match(sql, /p_passengers, p_seat_ids, p_baggage, p_meals, NULL/);
  assert.ok(sql.indexOf('set_booking_fare') < sql.indexOf('INSERT INTO public.booking_discounts'));
  assert.match(sql, /applicable_to IN \('all', 'flight'\)/);
  assert.match(sql, /DISCOUNT_NOT_ELIGIBLE/);
  assert.match(sql, /TO service_role/);
});

test('booking references do not depend on pgcrypto search paths', async () => {
  const sql = await readFile(bookingReferenceMigrationUrl, 'utf8');
  assert.match(sql, /booking_reference_seq/);
  assert.match(sql, /NEXTVAL\('public\.booking_reference_seq'\)/);
  assert.doesNotMatch(sql, /ENCODE\(gen_random_bytes/);
  assert.match(sql, /CREATE TRIGGER bookings_assign_defaults/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /uq_booking_single_discount/);
});

test('hardening migration contains the core concurrency and recovery invariants', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  const requiredFragments = [
    'uq_pending_payment_per_booking_purpose',
    'get_or_create_payment_intent',
    'create_booking_v2',
    'FOR UPDATE SKIP LOCKED',
    'process_payment_webhook_v2',
    'uq_webhook_provider_event',
    'claim_outbox_events',
    'claim_refund_reconciliation',
    'update_refund_reconciliation_v2',
    'reconcile_flight_inventory',
    'flight_boarding_counters',
    'mapped_bookings',
    'cancel_booking_v2',
    'cancel_flight_v2',
    'search_flights_v2',
  ];
  for (const fragment of requiredFragments) assert.match(sql, new RegExp(fragment));
  assert.doesNotMatch(
    sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.check_in_passenger')),
    /MAX\(boarding_sequence\)/,
  );
});

test('public seat mutation endpoints have been removed', async () => {
  const source = await readFile(
    new URL('../src/modules/seats/seat.routes.js', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /\/hold|\/release/);
});

test('operations form options are protected and raw resource fields are allowlisted', async () => {
  const [routes, service] = await Promise.all([
    readFile(new URL('../src/modules/operations/operation.routes.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/operations/operation.service.js', import.meta.url), 'utf8'),
  ]);
  assert.ok(
    routes.indexOf("router.use('/admin', requireRole('admin'))") <
      routes.indexOf("router.get('/admin/form-options'"),
  );
  assert.match(service, /assertSafeResourcePayload/);
  assert.match(service, /Unsupported fields/);
});

test('admin dashboard falls back to direct aggregates when its RPC is unavailable', async () => {
  const source = await readFile(
    new URL('../src/modules/admin/admin.queries.js', import.meta.url),
    'utf8',
  );
  assert.match(source, /admin_dashboard_rpc_fallback/);
  assert.match(source, /return getDashboardFromTables\(\)/);
  assert.match(source, /countRows\('flights'/);
  assert.match(source, /getConfirmedRevenue\(\)/);
});

test('flight reads retry the primary database and search has a table fallback', async () => {
  const source = await readFile(
    new URL('../src/modules/flights/flight.queries.js', import.meta.url),
    'utf8',
  );
  assert.match(source, /preferredClient !== supabase/);
  assert.match(source, /flight_search_read_fallback/);
  assert.match(source, /preferPrimary: Boolean\(filters\.flightNumber\)/);
  assert.match(source, /return searchFromTables\(filters, departureFrom, departureTo, from, to\)/);
  assert.match(source, /loadSeatInventory/);
  assert.match(source, /return calculatePriceFromTables\(flightId\)/);
});

test('flight-number search has an index, bounded cache fallback and request coalescing', async () => {
  const [migration, cacheSource, serviceSource] = await Promise.all([
    readFile(flightSearchMigrationUrl, 'utf8'),
    readFile(new URL('../src/config/cache.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/flights/flight.service.js', import.meta.url), 'utf8'),
  ]);

  assert.match(migration, /idx_flights_sellable_number_departure/);
  assert.match(migration, /flight_number, departure_time/);
  assert.match(cacheSource, /MEMORY_CACHE_MAX_ENTRIES/);
  assert.match(cacheSource, /memoryVersions/);
  assert.match(serviceSource, /inFlightSearches/);
  assert.match(serviceSource, /flightNumber: filters\.flightNumber/);
});
