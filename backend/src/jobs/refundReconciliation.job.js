import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as operationQueries from '../modules/operations/operation.queries.js';

const workerId = `refund-${randomUUID()}`;
let timer;
let running = false;

const checkProvider = async (refund) => {
  const response = await fetch(env.paymentRefundStatusApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.paymentSecretKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': refund.idempotency_key,
    },
    body: JSON.stringify({
      refundRequestId: refund.id,
      providerRefundId: refund.provider_refund_id,
      transactionRef: refund.payment.transaction_ref,
      provider: refund.payment.provider,
    }),
    signal: AbortSignal.timeout(env.paymentRequestTimeoutMs),
  });
  if (!response.ok) throw new Error(`Refund status adapter returned ${response.status}`);
  return response.json();
};

const runOnce = async () => {
  if (running || !env.paymentRefundStatusApiUrl || !env.paymentSecretKey) return;
  running = true;
  try {
    const { data: claimed, error } = await supabase.rpc('claim_refund_reconciliation', {
      p_worker_id: workerId,
      p_limit: 20,
    });
    if (error) throw error;
    for (const row of claimed ?? []) {
      try {
        const refund = await operationQueries.findRefundRequest(row.id);
        const result = await checkProvider(refund);
        const status = String(result.status ?? '').toLowerCase();
        if (['succeeded', 'success', 'completed'].includes(status)) {
          await operationQueries.completeRefundV2(refund.id, result.id ?? result.refundId, result);
          logger.info('refund_completed', {
            refund_request_id: refund.id,
            booking_id: refund.booking_id,
          });
        } else if (row.status === 'completed') {
          await operationQueries.reconcileRefund(refund.id, {
            status: 'requires_review',
            providerStatus: status || 'unknown',
            providerResponse: result,
            failureReason: 'Database refund is completed but provider did not confirm it',
          });
        } else if (['failed', 'rejected', 'cancelled', 'not_found'].includes(status)) {
          await operationQueries.reconcileRefund(refund.id, {
            status: status === 'not_found' ? 'requires_review' : 'failed',
            providerStatus: status,
            providerResponse: result,
          });
        } else {
          await operationQueries.reconcileRefund(refund.id, {
            status: 'processing',
            providerStatus: status || 'processing',
            providerResponse: result,
          });
        }
      } catch (itemError) {
        await operationQueries
          .reconcileRefund(row.id, {
            status:
              row.status === 'completed' || Number(row.attempts) >= 8
                ? 'requires_review'
                : 'processing',
            failureReason: itemError.message,
          })
          .catch(() => {});
        logger.warn('refund_reconciliation_mismatch', {
          refund_request_id: row.id,
          error: itemError.message,
        });
      }
    }
  } catch (error) {
    logger.error('refund_reconciliation_failed', { error: error.message });
  } finally {
    running = false;
  }
};

export const startRefundReconciliationJob = () => {
  if (env.nodeEnv === 'test' || timer) return;
  void runOnce();
  timer = setInterval(() => void runOnce(), env.refundReconciliationIntervalMs);
  timer.unref();
};
