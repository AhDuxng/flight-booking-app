import assert from 'node:assert/strict';
import test from 'node:test';
import { throwDatabaseError } from '../src/utils/error.js';

const capture = (databaseError) => {
  try {
    throwDatabaseError(databaseError, 'Unable to create booking');
  } catch (error) {
    return error;
  }
  throw new Error('Expected throwDatabaseError to throw');
};

test('maps stale seat inventory constraints to a retryable booking conflict', () => {
  const databaseError = {
    code: '23514',
    message: 'new row violates check constraint "seats_hold_state_check"',
    details: 'Failing row contains (...)',
  };

  const error = capture(databaseError);

  assert.equal(error.status, 409);
  assert.equal(error.code, 'INVENTORY_STATE_CONFLICT');
  assert.equal(error.databaseCode, '23514');
  assert.equal(error.cause, databaseError);
});

test('maps missing booking RPC schema cache entries to migration required', () => {
  const error = capture({
    code: 'PGRST202',
    message: 'Could not find the function public.create_booking_v2 in the schema cache',
  });

  assert.equal(error.status, 503);
  assert.equal(error.code, 'DATABASE_MIGRATION_REQUIRED');
});

test('maps transaction conflicts without leaking them as HTTP 500', () => {
  const error = capture({ code: '40001', message: 'could not serialize access' });

  assert.equal(error.status, 409);
  assert.equal(error.code, 'DATABASE_RETRY_REQUIRED');
});

test('keeps unknown database failures private and observable', () => {
  const error = capture({ code: 'XX000', message: 'private database failure', hint: 'diagnostic' });

  assert.equal(error.status, 500);
  assert.equal(error.message, 'Unable to create booking');
  assert.equal(error.databaseCode, 'XX000');
  assert.equal(error.databaseHint, 'diagnostic');
});
