import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import * as paymentQueries from './payment.queries.js';
import * as paymentService from './payment.service.js';
import {
  createVnpayProviderEventId,
  isSuccessfulVnpayResult,
  verifyVnpaySignature,
} from './vnpay.gateway.js';

const sendIpnResponse = (res, rspCode, message) =>
  res.status(200).json({ RspCode: rspCode, Message: message });

const hasExpectedMerchant = (params) =>
  Boolean(params.vnp_TmnCode && params.vnp_TmnCode === env.vnpayTmnCode);

const getReturnedAmount = (params) => {
  if (!/^\d{1,12}$/.test(params.vnp_Amount ?? '')) return null;
  const amount = Number(params.vnp_Amount) / 100;
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
};

const buildResultUrl = ({ payment, result }) => {
  const resultUrl = new URL('/payment/result', env.frontendUrl);
  resultUrl.searchParams.set('result', result);
  if (payment?.booking_id) resultUrl.searchParams.set('bookingId', payment.booking_id);
  if (payment?.transaction_ref) {
    resultUrl.searchParams.set('transactionRef', payment.transaction_ref);
  }
  return resultUrl.toString();
};

export const handleVnpayReturn = async (req, res) => {
  const verification = verifyVnpaySignature(req.query, env.vnpayHashSecret);
  if (!verification.isValid || !hasExpectedMerchant(verification.params)) {
    return res.redirect(302, buildResultUrl({ result: 'invalid' }));
  }

  if (!verification.params.vnp_TxnRef) {
    return res.redirect(302, buildResultUrl({ result: 'invalid' }));
  }

  const payment = await paymentQueries.findByTransactionRef(verification.params.vnp_TxnRef);
  if (!payment || payment.provider !== 'vnpay') {
    return res.redirect(302, buildResultUrl({ result: 'not_found' }));
  }

  const amount = getReturnedAmount(verification.params);
  if (amount === null || amount !== Number(payment.amount_snapshot)) {
    return res.redirect(302, buildResultUrl({ payment, result: 'invalid' }));
  }

  const result = isSuccessfulVnpayResult(verification.params) ? 'processing' : 'failed';
  return res.redirect(302, buildResultUrl({ payment, result }));
};

export const handleVnpayIpn = async (req, res) => {
  const verification = verifyVnpaySignature(req.query, env.vnpayHashSecret);
  if (!verification.isValid || !hasExpectedMerchant(verification.params)) {
    return sendIpnResponse(res, '97', 'Invalid checksum');
  }

  const transactionRef = verification.params.vnp_TxnRef;
  if (!transactionRef) return sendIpnResponse(res, '01', 'Order not found');

  try {
    const payment = await paymentQueries.findByTransactionRef(transactionRef);
    if (!payment || payment.provider !== 'vnpay') {
      return sendIpnResponse(res, '01', 'Order not found');
    }

    const amount = getReturnedAmount(verification.params);
    if (amount === null || amount !== Number(payment.amount_snapshot)) {
      return sendIpnResponse(res, '04', 'Invalid amount');
    }

    const isSuccess = isSuccessfulVnpayResult(verification.params);
    const result = await paymentService.handleWebhook({
      providerEventId: createVnpayProviderEventId(verification.params),
      eventType: isSuccess ? 'payment.succeeded' : 'payment.failed',
      eventCreatedAt: new Date().toISOString(),
      bookingId: payment.booking_id,
      transactionRef,
      provider: 'vnpay',
      amount,
      currency: 'VND',
      status: isSuccess ? 'success' : 'failed',
      rawBody: verification.canonicalData,
      signature: verification.secureHash,
      rawPayload: req.query,
    });

    if (result?.duplicate || result?.processed === false) {
      return sendIpnResponse(res, '02', 'Order already confirmed');
    }
    return sendIpnResponse(res, '00', 'Confirm Success');
  } catch (error) {
    logger.error('vnpay_ipn_failed', {
      transaction_ref: transactionRef,
      error_code: error.code,
      error: error.message,
    });
    return sendIpnResponse(res, '99', 'Unknown error');
  }
};
