import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { hashRequest, normalizeIdempotencyKey, stableStringify } from '../src/utils/idempotency.js';
import { paymentWebhookSchema } from '../src/modules/payments/payment.schema.js';
import { isWebhookTimestampFresh, verifyWebhookHmac } from '../src/utils/webhook.js';
import {
  buildVnpayPaymentUrl,
  canonicalizeVnpayParams,
  createVnpaySecureHash,
  formatVnpayDate,
  normalizeVnpayIp,
  verifyVnpaySignature,
} from '../src/modules/payments/vnpay.gateway.js';
import { resolveFrontendOrigins } from '../src/config/frontendOrigins.js';
import { isSupabaseServerKey } from '../src/config/supabaseKey.js';

const migrationUrl = new URL(
  '../database/migrations/20260802000000_harden_core_transactions.sql',
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
  const jwt = (role) => [
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
  const signature = createHmac('sha256', 'test-secret').update(`${timestamp}.${rawBody}`).digest('hex');
  assert.equal(verifyWebhookHmac({ secret: 'test-secret', timestamp, rawBody, signature }), true);
  assert.equal(
    verifyWebhookHmac({ secret: 'test-secret', timestamp, rawBody: '{"currency":"VND","amount":100000}', signature }),
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
  assert.equal(
    canonical,
    'vnp_Amount=100000&vnp_OrderInfo=Thanh+toan+ve+may+bay&vnp_TxnRef=VF123',
  );
  assert.equal(createVnpaySecureHash(canonical, 'secret').length, 128);
  assert.equal(formatVnpayDate(new Date('2026-08-05T17:00:00.000Z')), '20260806000000');
  assert.equal(normalizeVnpayIp('::1'), '127.0.0.1');
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
  assert.doesNotMatch(sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.check_in_passenger')), /MAX\(boarding_sequence\)/);
});

test('public seat mutation endpoints have been removed', async () => {
  const source = await readFile(new URL('../src/modules/seats/seat.routes.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\/hold|\/release/);
});
