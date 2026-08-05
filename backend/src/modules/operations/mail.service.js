import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

let transporter;

const getTransporter = () => {
  if (!env.smtpHost) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
  });
  return transporter;
};

export const isMailConfigured = () => Boolean(env.smtpHost);

export const sendTicketEmail = async ({ booking, pdf }) => {
  const mailer = getTransporter();
  if (!mailer) return { sent: false, reason: 'smtp_not_configured' };
  const reference = booking.booking_reference ?? booking.id;
  const result = await mailer.sendMail({
    from: env.smtpFrom,
    to: booking.contact_email,
    subject: `Vé điện tử VietFly ${reference}`,
    text: `Đặt chỗ ${reference} đã được xác nhận. Vé điện tử được đính kèm trong email này.`,
    attachments: [
      { filename: `vietfly-${reference}.pdf`, content: pdf, contentType: 'application/pdf' },
    ],
  });
  return { sent: true, messageId: result.messageId };
};
