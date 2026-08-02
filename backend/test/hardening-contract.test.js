import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { hashRequest, normalizeIdempotencyKey, stableStringify } from '../src/utils/idempotency.js';
import { paymentWebhookSchema } from '../src/modules/payments/payment.schema.js';
import { isWebhookTimestampFresh, verifyWebhookHmac } from '../src/utils/webhook.js';

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
