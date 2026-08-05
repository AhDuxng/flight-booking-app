import { createHmac, timingSafeEqual } from 'node:crypto';
import { createHttpError } from '../../utils/error.js';

const VNPAY_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VNPAY_VERSION = '2.1.0';

const requireWholeVnd = (amount, message) => {
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value <= 0) throw createHttpError(422, message);
  return value;
};

const sortedVnpayEntries = (params) =>
  Object.entries(params)
    .filter(
      ([key, value]) =>
        key.startsWith('vnp_') &&
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType' &&
        value !== undefined &&
        value !== null &&
        value !== '',
    )
    .map(([key, value]) => [key, String(value)])
    .sort(([left], [right]) => left.localeCompare(right));

export const canonicalizeVnpayParams = (params) =>
  new URLSearchParams(sortedVnpayEntries(params)).toString();

export const formatVnpayDate = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VNPAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
};

export const createVnpaySecureHash = (canonicalData, hashSecret) =>
  createHmac('sha512', hashSecret).update(canonicalData, 'utf8').digest('hex');

const safeHexEqual = (left, right) => {
  if (!/^[a-f0-9]{128}$/i.test(left ?? '') || !/^[a-f0-9]{128}$/i.test(right ?? '')) {
    return false;
  }
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const normalizeVnpayIp = (ipAddress) => {
  const value = String(ipAddress ?? '')
    .split(',')[0]
    .trim();
  if (!value || value === '::1') return '127.0.0.1';
  if (value.startsWith('::ffff:')) return value.slice(7);
  return value.slice(0, 45);
};

export const isVnpayConfigured = (config) =>
  Boolean(config?.tmnCode && config?.hashSecret && config?.payUrl && config?.returnUrl);

export const buildVnpayPaymentUrl = ({ payment, clientIp, config, now = new Date() }) => {
  if (!isVnpayConfigured(config)) {
    throw createHttpError(503, 'VNPAY is not configured');
  }

  const amount = Number(payment.amount_snapshot ?? payment.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw createHttpError(422, 'VNPAY requires a positive whole-number VND amount');
  }

  const configuredExpiry = payment.expires_at ? new Date(payment.expires_at) : null;
  const maximumExpiry = new Date(now.getTime() + 15 * 60 * 1000);
  const expiresAt =
    configuredExpiry &&
    Number.isFinite(configuredExpiry.getTime()) &&
    configuredExpiry < maximumExpiry
      ? configuredExpiry
      : maximumExpiry;
  if (expiresAt <= now) throw createHttpError(409, 'Payment intent has expired');

  const params = {
    vnp_Version: VNPAY_VERSION,
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(amount * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: payment.transaction_ref,
    vnp_OrderInfo: `Thanh toan ve may bay ${payment.transaction_ref}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: normalizeVnpayIp(clientIp),
    vnp_CreateDate: formatVnpayDate(now),
    vnp_ExpireDate: formatVnpayDate(expiresAt),
  };
  const canonicalData = canonicalizeVnpayParams(params);
  const secureHash = createVnpaySecureHash(canonicalData, config.hashSecret);

  return {
    checkoutUrl: `${config.payUrl}?${canonicalData}&vnp_SecureHash=${secureHash}`,
    requestPayload: params,
  };
};

const getOriginalTransactionDate = (payment) => {
  const payload = payment.raw_payload ?? {};
  const rawDate =
    payload.vnp_OriginalCreateDate ?? payload.vnp_CreateDate ?? payload.request?.vnp_CreateDate;
  if (/^\d{14}$/.test(String(rawDate ?? ''))) return String(rawDate);
  const createdAt = new Date(payment.created_at ?? payment.paid_at);
  if (!Number.isFinite(createdAt.getTime())) {
    throw createHttpError(422, 'VNPAY original transaction date is unavailable');
  }
  return formatVnpayDate(createdAt);
};

const requireVnpayApiConfig = (config) => {
  if (!config?.tmnCode || !config?.hashSecret || !config?.apiUrl) {
    throw createHttpError(503, 'VNPAY refund API is not configured');
  }
};

export const buildVnpayRefundRequest = ({
  refund,
  config,
  now = new Date(),
  ipAddress,
  createBy = 'VietFly',
}) => {
  requireVnpayApiConfig(config);
  const amount = requireWholeVnd(
    refund.approved_amount,
    'VNPAY requires a positive whole-number VND refund amount',
  );
  const paidAmount = Number(refund.payment.amount_snapshot ?? refund.payment.amount);
  const transactionNo = String(refund.payment.raw_payload?.vnp_TransactionNo ?? '').trim();
  if (!transactionNo) throw createHttpError(422, 'VNPAY transaction number is unavailable');

  const params = {
    vnp_RequestId: String(refund.id).replaceAll('-', '').slice(0, 32),
    vnp_Version: VNPAY_VERSION,
    vnp_Command: 'refund',
    vnp_TmnCode: config.tmnCode,
    vnp_TransactionType: amount === paidAmount ? '02' : '03',
    vnp_TxnRef: refund.payment.transaction_ref,
    vnp_Amount: String(amount * 100),
    vnp_TransactionNo: transactionNo,
    vnp_TransactionDate: getOriginalTransactionDate(refund.payment),
    vnp_CreateBy:
      String(createBy)
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 100) || 'VietFly',
    vnp_CreateDate: formatVnpayDate(now),
    vnp_IpAddr: normalizeVnpayIp(ipAddress),
    vnp_OrderInfo: `Hoan tien dat cho ${refund.booking?.booking_reference ?? refund.booking_id}`,
  };
  const checksumData = [
    params.vnp_RequestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TransactionType,
    params.vnp_TxnRef,
    params.vnp_Amount,
    params.vnp_TransactionNo,
    params.vnp_TransactionDate,
    params.vnp_CreateBy,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo,
  ].join('|');

  return {
    apiUrl: config.apiUrl,
    checksumData,
    payload: { ...params, vnp_SecureHash: createVnpaySecureHash(checksumData, config.hashSecret) },
  };
};

export const buildVnpayQueryRequest = ({
  payment,
  requestId,
  config,
  now = new Date(),
  ipAddress,
}) => {
  requireVnpayApiConfig(config);
  const params = {
    vnp_RequestId: String(requestId).replaceAll('-', '').slice(0, 32),
    vnp_Version: VNPAY_VERSION,
    vnp_Command: 'querydr',
    vnp_TmnCode: config.tmnCode,
    vnp_TxnRef: payment.transaction_ref,
    vnp_OrderInfo: `Doi soat giao dich ${payment.transaction_ref}`,
    vnp_TransactionNo: payment.raw_payload?.vnp_TransactionNo,
    vnp_TransactionDate: getOriginalTransactionDate(payment),
    vnp_CreateDate: formatVnpayDate(now),
    vnp_IpAddr: normalizeVnpayIp(ipAddress),
  };
  const checksumData = [
    params.vnp_RequestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TxnRef,
    params.vnp_TransactionDate,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo,
  ].join('|');
  return {
    apiUrl: config.apiUrl,
    checksumData,
    payload: { ...params, vnp_SecureHash: createVnpaySecureHash(checksumData, config.hashSecret) },
  };
};

export const verifyVnpayApiResponse = (payload, hashSecret) => {
  const secureHash = String(payload?.vnp_SecureHash ?? '');
  if (!secureHash) return false;
  const responseFields = [
    payload.vnp_ResponseId,
    payload.vnp_Command,
    payload.vnp_ResponseCode,
    payload.vnp_Message,
    payload.vnp_TmnCode,
    payload.vnp_TxnRef,
    payload.vnp_Amount,
    payload.vnp_BankCode,
    payload.vnp_PayDate,
    payload.vnp_TransactionNo,
    payload.vnp_TransactionType,
    payload.vnp_TransactionStatus,
    payload.vnp_OrderInfo,
  ];
  if (payload.vnp_Command === 'querydr') {
    responseFields.push(payload.vnp_PromotionCode, payload.vnp_PromotionAmount);
  }
  const checksumData = responseFields.map((value) => String(value ?? '')).join('|');
  return safeHexEqual(secureHash, createVnpaySecureHash(checksumData, hashSecret ?? ''));
};

export const classifyVnpayRefundResponse = (payload) => {
  const responseCode = String(payload?.vnp_ResponseCode ?? '');
  const transactionStatus = String(payload?.vnp_TransactionStatus ?? '');
  if (responseCode === '00' && transactionStatus === '00') return 'succeeded';
  if (
    responseCode === '00' ||
    responseCode === '94' ||
    ['01', '05', '06'].includes(transactionStatus)
  ) {
    return 'processing';
  }
  return 'failed';
};

export const verifyVnpaySignature = (params, hashSecret) => {
  const secureHash = String(params?.vnp_SecureHash ?? '');
  const canonicalData = canonicalizeVnpayParams(params ?? {});
  const expectedHash = createVnpaySecureHash(canonicalData, hashSecret ?? '');
  return {
    canonicalData,
    isValid: Boolean(hashSecret) && safeHexEqual(secureHash, expectedHash),
    params: Object.fromEntries(sortedVnpayEntries(params ?? {})),
    secureHash,
  };
};

export const isSuccessfulVnpayResult = (params) =>
  params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';

export const createVnpayProviderEventId = (params) =>
  [
    'vnpay',
    params.vnp_TmnCode,
    params.vnp_TxnRef,
    params.vnp_TransactionNo || 'none',
    params.vnp_ResponseCode || 'none',
    params.vnp_TransactionStatus || 'none',
  ]
    .join(':')
    .slice(0, 255);
