import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './operation.controller.js';
import * as schema from './operation.schema.js';

const router = Router();

router.get('/cms', validate({ query: schema.contentQuerySchema }), controller.getContent);
router.get('/flight-status', validate({ query: schema.flightStatusQuerySchema }), controller.getFlightStatus);
router.get('/fares', validate({ query: schema.fareQuerySchema }), controller.getFares);
router.get('/ancillaries', controller.getAncillaries);

router.use(authenticate);
router.get('/bookings/:bookingId', validate({ params: schema.bookingParamsSchema }), controller.getBookingOperations);
router.patch('/bookings/:bookingId/fare', validate({ params: schema.bookingParamsSchema, body: schema.setFareSchema }), controller.setBookingFare);
router.get('/bookings/:bookingId/e-ticket.pdf', validate({ params: schema.bookingParamsSchema }), controller.getBookingTicketPdf);
router.post('/bookings/:bookingId/e-ticket/email', validate({ params: schema.bookingParamsSchema }), controller.emailBookingTicket);
router.get('/tickets/:ticketId/pdf', validate({ params: schema.ticketParamsSchema }), controller.getTicketPdf);
router.post('/bookings/:bookingId/check-in', validate({ params: schema.bookingParamsSchema, body: schema.checkInSchema }), controller.checkIn);
router.get('/boarding-passes/:checkInId/pdf', validate({ params: schema.checkInParamsSchema }), controller.getBoardingPassPdf);
router.get('/bookings/:bookingId/change-options', validate({ params: schema.bookingParamsSchema, query: schema.changeOptionsQuerySchema }), controller.getChangeOptions);
router.post('/bookings/:bookingId/change-quotes', validate({ params: schema.bookingParamsSchema, body: schema.changeQuoteSchema }), controller.quoteFlightChange);
router.post('/change-quotes/:requestId/confirm', validate({ params: schema.requestParamsSchema, body: schema.changeConfirmSchema }), controller.confirmFlightChange);
router.post('/ancillaries/purchase', validate(schema.ancillaryPurchaseSchema), controller.addAncillary);
router.get('/support-tickets', controller.getSupportTickets);
router.post('/support-tickets', validate(schema.supportTicketSchema), controller.createSupportTicket);
router.post('/support-tickets/:ticketId/messages', validate({ params: schema.supportMessageParamsSchema, body: schema.supportMessageSchema }), controller.addSupportMessage);

router.use('/admin', requireRole('admin'));
router.get('/admin/:resource', validate({ params: schema.resourceParamsSchema }), controller.getAdminResource);
router.post('/admin/schedules/generate', controller.generateSchedules);
router.post('/admin/:resource', validate({ params: schema.resourceParamsSchema, body: schema.adminResourceBodySchema }), controller.createAdminResource);
router.patch('/admin/:resource/:id', validate({ params: schema.resourceItemParamsSchema, body: schema.adminResourceBodySchema }), controller.updateAdminResource);
router.post('/admin/refunds/:refundId/decision', validate({ params: schema.refundParamsSchema, body: schema.refundDecisionSchema }), controller.decideRefund);
router.post('/admin/support/:ticketId/messages', validate({ params: schema.supportMessageParamsSchema, body: schema.adminSupportMessageSchema }), controller.addAdminSupportMessage);

export default router;
