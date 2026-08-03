const express = require('express');
const cors = require('cors');
const { VNPay, ignoreLogger } = require('vnpay');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize VNPay instance
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE || 'HBLG3X1Y', // Default sandbox code
  secureSecret: process.env.VNPAY_SECURE_SECRET || 'MTHH2Q9P2DXXL082D9GDKF43I1YXV4YV', // Default sandbox secret
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  logger: ignoreLogger,
});

// In-memory store to remember where to send webhooks and redirect the user
const checkoutSessions = new Map();

// 1. Endpoint called by Core Backend to create a payment URL
app.post('/', (req, res) => {
  const { provider, bookingId, transactionRef, amount, currency, returnUrl, cancelUrl, webhookUrl } = req.body;
  
  if (provider !== 'vnpay') {
    return res.status(400).json({ error: 'Unsupported provider' });
  }

  // Store session info
  checkoutSessions.set(transactionRef, { bookingId, returnUrl, cancelUrl, webhookUrl, amount, currency });

  // Create VNPay payment URL
  const vnpayUrl = vnpay.buildPaymentUrl({
    vnp_Amount: amount, // vnpay lib handles the * 100 conversion automatically for VND
    vnp_IpAddr: req.ip === '::1' ? '127.0.0.1' : req.ip,
    vnp_TxnRef: transactionRef,
    vnp_OrderInfo: `Payment for booking ${bookingId}`,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: `http://localhost:5002/vnpay-return`, 
    vnp_Locale: 'vn',
  });

  res.json({ checkoutUrl: vnpayUrl });
});

// 2. Endpoint hit by VNPay when user finishes payment (return URL)
app.get('/vnpay-return', async (req, res) => {
  try {
    const verify = vnpay.verifyReturnUrl(req.query);
    const { vnp_TxnRef, vnp_TransactionNo, vnp_Amount, vnp_PayDate, vnp_ResponseCode } = req.query;
    
    const session = checkoutSessions.get(vnp_TxnRef);
    if (!session) {
      return res.status(404).send('Session not found or expired');
    }

    const isSuccess = verify.isSuccess && vnp_ResponseCode === '00';

    // A. Trigger the backend Webhook (since local VNPay can't reach localhost)
    if (session.webhookUrl) {
      const webhookPayload = {
        providerEventId: vnp_TransactionNo || `test_${Date.now()}`,
        eventType: 'payment_completed',
        eventCreatedAt: new Date().toISOString(),
        bookingId: session.bookingId,
        transactionRef: vnp_TxnRef,
        provider: 'vnpay',
        amount: session.amount,
        currency: session.currency,
        status: isSuccess ? 'succeeded' : 'failed',
        rawBody: JSON.stringify(req.query),
        signature: 'simulated_signature',
        rawPayload: req.query,
      };

      try {
        await axios.post(session.webhookUrl, webhookPayload, {
          headers: {
            'x-webhook-signature': process.env.WEBHOOK_SECRET || 'test_secret',
            'Content-Type': 'application/json'
          }
        });
        console.log(`Webhook triggered successfully for ${vnp_TxnRef}`);
      } catch (err) {
        console.error(`Failed to trigger webhook for ${vnp_TxnRef}:`, err.message);
      }
    }

    // B. Redirect the user back to Frontend
    const redirectUrl = isSuccess ? session.returnUrl : session.cancelUrl;
    res.redirect(`${redirectUrl}?status=${isSuccess ? 'success' : 'failed'}&transaction_ref=${vnp_TxnRef}`);

  } catch (error) {
    console.error('VNPay verification error:', error);
    res.status(400).send('Invalid request');
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`🚀 VNPay Adapter Gateway is running on http://localhost:${PORT}`);
});
