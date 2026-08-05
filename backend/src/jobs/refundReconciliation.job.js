import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as operationQueries from '../modules/operations/operation.queries.js';
import {
  buildVnpayQueryRequest,
  verifyVnpayApiResponse,
} from '../modules/payments/vnpay.gateway.js';

const workerId = `refund-${randomUUID()}`;
let timer;
let running = false;

const checkProvider = async (refund) => {
  if (refund.payment.provider === 'vnpay') {
    const request = buildVnpayQueryRequest({
      payment: refund.payment,
      requestId: randomUUID(),
      config: {
        tmnCode: env.vnpayTmnCode,
        hashSecret: env.vnpayHashSecret,
        apiUrl: env.vnpayApiUrl,
      },
    });
    const response = await fetch(request.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload),
      signal: AbortSignal.timeout(env.paymentRequestTimeoutMs),
    });
    if (!response.ok) throw new Error(`VNPAY query adapter returned ${response.status}`);
    const result = await response.json();
    if (!verifyVnpayApiResponse(result, env.vnpayHashSecret)) {
      throw new Error('VNPAY query response checksum is invalid');
    }
    const responseCode = String(result.vnp_ResponseCode ?? '');
    const transactionType = String(result.vnp_TransactionType ?? '');
    const transactionStatus = String(result.vnp_TransactionStatus ?? '');
    let status = 'processing';
    if (responseCode === '00' && ['02', '03'].includes(transactionType)) {
      if (transactionStatus === '00') status = 'succeeded';
      else if (['02', '04', '07', '09'].includes(transactionStatus)) status = 'failed';
    } else if (!['00', '94'].includes(responseCode)) {
      status = responseCode === '91' ? 'not_found' : 'failed';
    }
    return {
      ...result,
      id: result.vnp_ResponseId ?? result.vnp_TransactionNo,
      status,
    };
  }
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
  const hasGenericAdapter = env.paymentRefundStatusApiUrl && env.paymentSecretKey;
  const hasVnpayAdapter = env.vnpayApiUrl && env.vnpayTmnCode && env.vnpayHashSecret;
  if (running || (!hasGenericAdapter && !hasVnpayAdapter)) return;
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
        if (refund.payment.provider !== 'vnpay' && !hasGenericAdapter) {
          await operationQueries.reconcileRefund(refund.id, {
            status: 'requires_review',
            failureReason: 'Refund status adapter is not configured for this provider',
          });
          continue;
        }
        if (refund.payment.provider === 'vnpay' && !hasVnpayAdapter) {
          await operationQueries.reconcileRefund(refund.id, {
            status: 'requires_review',
            failureReason: 'VNPAY query adapter is not configured',
          });
          continue;
        }
        if (refund.payment.provider === 'vnpay' && row.status === 'completed') {
          await operationQueries.reconcileRefund(refund.id, {
            status: 'completed',
            providerStatus: refund.provider_status ?? 'succeeded',
            providerResponse: refund.provider_response ?? {},
          });
          continue;
        }
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
