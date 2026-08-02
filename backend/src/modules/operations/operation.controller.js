import * as service from './operation.service.js';

const sendData = (handler, status = 200) => async (req, res, next) => {
  try { return res.status(status).json({ data: await handler(req) }); } catch (error) { return next(error); }
};
const sendPdf = (handler) => async (req, res, next) => {
  try {
    const file = await handler(req);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(file.buffer);
  } catch (error) { return next(error); }
};

export const getContent = sendData((req) => service.getContent(req.query));
export const getFlightStatus = sendData((req) => service.getFlightStatus(req.query));
export const getFares = sendData((req) => service.getFares(req.query.flightId));
export const getAncillaries = sendData(() => service.getAncillaries());
export const getBookingOperations = sendData((req) => service.getBookingOperations(req.params.bookingId, req.user.id));
export const setBookingFare = sendData((req) => service.setBookingFare(req.params.bookingId, req.user.id, req.body.fareId));
export const getTicketPdf = sendPdf((req) => service.getTicketPdf(req.params.ticketId, req.user.id));
export const getBookingTicketPdf = sendPdf((req) => service.getBookingTicketPdf(req.params.bookingId, req.user.id));
export const emailBookingTicket = sendData((req) => service.emailBookingTicket(req.params.bookingId, req.user.id));
export const checkIn = sendData((req) => service.checkIn(req.params.bookingId, req.user.id, req.body), 201);
export const getBoardingPassPdf = sendPdf((req) => service.getBoardingPassPdf(req.params.checkInId, req.user.id));
export const getChangeOptions = sendData((req) => service.getChangeOptions(req.params.bookingId, req.user.id, req.query));
export const quoteFlightChange = sendData((req) => service.quoteFlightChange(req.params.bookingId, req.user.id, req.body.newFlightId), 201);
export const confirmFlightChange = sendData((req) => service.confirmFlightChange(
  req.params.requestId,
  req.user.id,
  req.body.provider,
  req.get('idempotency-key'),
));
export const addAncillary = sendData((req) => service.addAncillary(req.user.id, req.body), 201);
export const getSupportTickets = sendData((req) => service.getSupportTickets(req.user.id));
export const createSupportTicket = sendData((req) => service.createSupportTicket(req.user.id, req.body), 201);
export const addSupportMessage = sendData((req) => service.addSupportMessage(req.params.ticketId, req.user.id, req.body.body), 201);
export const getAdminResource = sendData((req) => service.getAdminResource(req.params.resource));
export const createAdminResource = sendData((req) => service.createAdminResource(req.params.resource, req.body, req.user.id), 201);
export const updateAdminResource = sendData((req) => service.updateAdminResource(req.params.resource, req.params.id, req.body));
export const decideRefund = sendData((req) => service.decideRefund(req.params.refundId, req.user.id, req.body));
export const generateSchedules = sendData(() => service.generateSchedules());
export const addAdminSupportMessage = sendData((req) => service.addAdminSupportMessage(req.params.ticketId, req.user.id, req.body), 201);
