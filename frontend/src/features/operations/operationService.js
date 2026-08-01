import { api } from "@/services/api";

const download = async (url, fallbackName) => {
  const blob = await api.get(url, { responseType: "blob" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

export const operationService = {
  addAncillary: (payload) => api.post("/operations/ancillaries/purchase", payload),
  addSupportMessage: (ticketId, body) => api.post(`/operations/support-tickets/${ticketId}/messages`, { body }),
  addAdminSupportMessage: (ticketId, body, isInternal = false) => api.post(`/operations/admin/support/${ticketId}/messages`, { body, isInternal }),
  checkIn: (bookingId, passengerIds, seatAssignments = []) => api.post(`/operations/bookings/${bookingId}/check-in`, { passengerIds, documentConfirmed: true, seatAssignments }),
  confirmChange: (requestId, provider = "cash") => api.post(`/operations/change-quotes/${requestId}/confirm`, { provider }),
  createAdminResource: (resource, payload) => api.post(`/operations/admin/${resource}`, payload),
  createSupportTicket: (payload) => api.post("/operations/support-tickets", payload),
  decideRefund: (refundId, payload) => api.post(`/operations/admin/refunds/${refundId}/decision`, payload),
  downloadBoardingPass: (checkInId) => download(`/operations/boarding-passes/${checkInId}/pdf`, `boarding-pass-${checkInId}.pdf`),
  downloadETicket: (bookingId) => download(`/operations/bookings/${bookingId}/e-ticket.pdf`, `vietfly-${bookingId}.pdf`),
  emailETicket: (bookingId) => api.post(`/operations/bookings/${bookingId}/e-ticket/email`),
  generateSchedules: () => api.post("/operations/admin/schedules/generate"),
  getAdminResource: (resource) => api.get(`/operations/admin/${resource}`),
  getAncillaries: () => api.get("/operations/ancillaries"),
  getBooking: (bookingId) => api.get(`/operations/bookings/${bookingId}`),
  getChangeOptions: (bookingId) => api.get(`/operations/bookings/${bookingId}/change-options`),
  getContent: (params) => api.get("/operations/cms", { params }),
  getFares: (flightId) => api.get("/operations/fares", { params: { flightId } }),
  getFlightStatus: (params) => api.get("/operations/flight-status", { params }),
  getSupportTickets: () => api.get("/operations/support-tickets"),
  quoteChange: (bookingId, newFlightId) => api.post(`/operations/bookings/${bookingId}/change-quotes`, { newFlightId }),
  setBookingFare: (bookingId, fareId) => api.patch(`/operations/bookings/${bookingId}/fare`, { fareId }),
  updateAdminResource: (resource, id, payload) => api.patch(`/operations/admin/${resource}/${id}`, payload),
};
