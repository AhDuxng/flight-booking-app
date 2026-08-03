import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2, Download, Mail, Plane, QrCode, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import { operationService } from "./operationService";
import { paymentService } from "@/features/payments/paymentService";
import { flightService } from "@/features/flights/flightService";

export default function BookingOperationsPanel({ booking, onRefresh }) {
  return (
    <section className="mt-stack-lg grid gap-stack-lg lg:grid-cols-2 print:hidden">
      <TicketAndCheckIn booking={booking} onRefresh={onRefresh} />
      <FareAndChange booking={booking} onRefresh={onRefresh} />
      <RefundStatus booking={booking} />
      <Ancillaries booking={booking} onRefresh={onRefresh} />
    </section>
  );
}

function TicketAndCheckIn({ booking, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const activeTickets = (booking.tickets ?? []).filter((ticket) => ["issued", "reissued"].includes(ticket.status));
  const checkedPassengers = new Set((booking.check_ins ?? []).filter((item) => item.status === "checked_in").map((item) => item.passenger_id));
  const remaining = (booking.passengers ?? []).filter((item) => !checkedPassengers.has(item.id));
  const departure = new Date(booking.flight?.departure_time).getTime();
  const checkInOpen = Date.now() >= departure - 24 * 60 * 60 * 1000 && Date.now() <= departure - 45 * 60 * 1000 && booking.status === "confirmed";
  const act = async (handler, success) => { setBusy(true); try { await handler(); toast.success(success); await onRefresh(); } catch (error) { toast.error(getErrorMessage(error, "Không thể thực hiện thao tác.")); } finally { setBusy(false); } };
  const checkInWithSeat = async () => {
    const response = await flightService.getSeats(booking.flight_id);
    const available = (response.data ?? []).filter((seat) => seat.status === "available");
    const assignments = [];
    for (const passenger of remaining) {
      const value = window.prompt(`Ghế mới cho ${passenger.last_name} ${passenger.first_name} (để trống nếu giữ nguyên):\n${available.slice(0, 40).map((seat) => seat.seat_number).join(", ")}`);
      if (!value?.trim()) continue;
      const seat = available.find((item) => item.seat_number.toUpperCase() === value.trim().toUpperCase());
      if (!seat || assignments.some((item) => item.seatId === seat.id)) throw new Error(`Ghế ${value} không khả dụng.`);
      assignments.push({ passengerId: passenger.id, seatId: seat.id });
    }
    return operationService.checkIn(booking.id, remaining.map((item) => item.id), assignments);
  };
  if (!activeTickets.length && booking.status !== "confirmed") return null;
  return (
    <Panel icon={QrCode} title="Vé điện tử & check-in">
      {activeTickets.length ? <div className="space-y-2">{activeTickets.map((ticket) => <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container p-3" key={ticket.id}><div><p className="font-data-mono font-semibold text-primary">{ticket.ticket_number}</p><p className="text-xs text-on-surface-variant">{ticket.status === "reissued" ? "Vé phát hành lại" : "Vé đã phát hành"}</p></div><button className={smallButton} onClick={() => operationService.downloadETicket(booking.id)} type="button"><Download className="h-4 w-4" />PDF</button></div>)}</div> : null}
      {activeTickets.length ? <div className="mt-3 flex flex-wrap gap-2"><button className={smallButton} disabled={busy} onClick={() => act(() => operationService.emailETicket(booking.id), "Đã gửi vé qua email.")} type="button"><Mail className="h-4 w-4" />Gửi email</button>{checkInOpen && remaining.length ? <><button className={primaryButton} disabled={busy} onClick={() => act(() => operationService.checkIn(booking.id, remaining.map((item) => item.id)), "Check-in thành công.")} type="button"><CheckCircle2 className="h-4 w-4" />Check-in {remaining.length} khách</button><button className={smallButton} disabled={busy} onClick={() => act(checkInWithSeat, "Check-in và cập nhật ghế thành công.")} type="button">Check-in & đổi ghế</button></> : null}</div> : null}
      {(booking.check_ins ?? []).map((item) => <button className="mt-2 flex w-full items-center justify-between rounded-lg border border-status-success bg-success-container/30 p-3 text-left" key={item.id} onClick={() => operationService.downloadBoardingPass(item.id)} type="button"><span>Boarding pass · #{String(item.boarding_sequence).padStart(3, "0")}</span><Download className="h-4 w-4" /></button>)}
      {booking.status === "confirmed" && !checkInOpen && !(booking.check_ins ?? []).length ? <p className="mt-3 text-body-sm text-on-surface-variant">Check-in trực tuyến mở trước 24 giờ và đóng trước 45 phút.</p> : null}
    </Panel>
  );
}

function FareAndChange({ booking, onRefresh }) {
  const [fares, setFares] = useState([]);
  const [options, setOptions] = useState([]);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState(["cash"]);
  const [provider, setProvider] = useState("cash");
  useEffect(() => {
    operationService.getFares(booking.flight_id).then((response) => setFares(response.data ?? [])).catch(() => {});
    paymentService.getConfig().then((response) => { const values = response.data?.providers ?? ["cash"]; setProviders(values); setProvider(values[0] ?? "cash"); }).catch(() => {});
  }, [booking.flight_id]);
  const loadOptions = async () => { setBusy(true); try { const response = await operationService.getChangeOptions(booking.id); setOptions(response.data ?? []); } catch (error) { toast.error(getErrorMessage(error, "Không thể tải chuyến thay thế.")); } finally { setBusy(false); } };
  const selectFare = async (fareId) => { setBusy(true); try { await operationService.setBookingFare(booking.id, fareId); toast.success("Đã cập nhật hạng giá."); await onRefresh(); } catch (error) { toast.error(getErrorMessage(error, "Không thể đổi hạng giá.")); } finally { setBusy(false); } };
  const createQuote = async (flightId) => { setBusy(true); try { const response = await operationService.quoteChange(booking.id, flightId); setQuote(response.data); } catch (error) { toast.error(getErrorMessage(error, "Không thể báo giá đổi chuyến.")); } finally { setBusy(false); } };
  const confirm = async () => { setBusy(true); try { const response = await operationService.confirmChange(quote.id, provider); toast.success(response.data.payment ? "Đã tạo thanh toán chênh lệch." : "Đổi chuyến thành công."); if (response.data.payment?.checkout_url) { window.location.assign(response.data.payment.checkout_url); return; } setQuote(null); setOptions([]); await onRefresh(); } catch (error) { toast.error(getErrorMessage(error, "Không thể xác nhận đổi chuyến.")); } finally { setBusy(false); } };
  if (!["pending", "confirmed"].includes(booking.status)) return null;
  return (
    <Panel icon={ArrowRightLeft} title={booking.status === "pending" ? "Chọn hạng giá" : "Đổi chuyến bay"}>
      {booking.status === "pending" ? <div className="space-y-2">{fares.map((fare) => <button className={`w-full rounded-lg border p-3 text-left ${booking.fare_id === fare.id ? "border-primary bg-primary-fixed" : "border-outline-variant"}`} disabled={busy} key={fare.id} onClick={() => selectFare(fare.id)} type="button"><div className="flex justify-between gap-2"><strong>{fare.name}</strong><span>×{Number(fare.price_multiplier).toFixed(2)}</span></div><p className="mt-1 text-xs text-on-surface-variant">Hành lý {fare.checked_baggage_kg}kg · Phí đổi {formatCurrency(fare.change_fee)} · {fare.refundable ? "Có hoàn vé" : "Không hoàn vé"}</p></button>)}</div> : <><p className="text-body-sm text-on-surface-variant">Hạng hiện tại: <strong>{booking.fare?.name ?? "Economy Lite"}</strong>. Giá và ghế sẽ được xác nhận lại trước khi đổi.</p>{!options.length ? <button className={`${primaryButton} mt-4`} disabled={busy} onClick={loadOptions} type="button">Tìm chuyến thay thế</button> : <div className="mt-3 space-y-2">{options.slice(0, 6).map((flight) => <button className="w-full rounded-lg border border-outline-variant p-3 text-left hover:border-primary" key={flight.id} onClick={() => createQuote(flight.id)} type="button"><div className="flex justify-between"><strong>{flight.flight_number}</strong><span>{formatCurrency(flight.quoted_fare_total)}</span></div><p className="text-xs text-on-surface-variant">{formatDateTime(flight.departure_time)}</p></button>)}</div>}{quote ? <div className="mt-4 rounded-lg bg-primary-fixed p-3"><p>Chênh lệch: {formatCurrency(quote.fare_difference)}</p><p>Phí đổi: {formatCurrency(quote.change_fee)}</p><p className="font-semibold">Cần thanh toán: {formatCurrency(quote.additional_amount)}</p>{Number(quote.additional_amount) > 0 ? <select className="mt-3 h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3" onChange={(event) => setProvider(event.target.value)} value={provider}>{providers.map((item) => <option key={item} value={item}>{item === "cash" ? "Tiền mặt / quầy" : item.toUpperCase()}</option>)}</select> : null}<button className={`${primaryButton} mt-3`} disabled={busy} onClick={confirm} type="button">Xác nhận đổi chuyến</button></div> : null}</>}
    </Panel>
  );
}

function RefundStatus({ booking }) {
  const requests = booking.refund_requests ?? [];
  if (!requests.length && !["refund_pending", "refunded"].includes(booking.status)) return null;
  return <Panel icon={ShieldPlus} title="Hoàn tiền"><div className="space-y-2">{requests.map((item) => <div className="rounded-lg bg-surface-container p-3" key={item.id}><div className="flex justify-between"><strong>{formatCurrency(item.approved_amount ?? item.requested_amount)}</strong><span className="uppercase text-primary">{item.status}</span></div><p className="mt-1 text-xs text-on-surface-variant">{item.reason}{item.failure_reason ? ` · ${item.failure_reason}` : ""}</p></div>)}</div></Panel>;
}

function Ancillaries({ booking, onRefresh }) {
  const [services, setServices] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (booking.status === "pending") operationService.getAncillaries().then((response) => setServices(response.data ?? [])).catch(() => {}); }, [booking.status]);
  const existingIds = useMemo(() => new Set((booking.booking_ancillaries ?? []).map((item) => item.ancillary_service_id)), [booking.booking_ancillaries]);
  if (booking.status !== "pending" && !(booking.booking_ancillaries ?? []).length) return null;
  const add = async (service) => { setBusy(true); try { await operationService.addAncillary({ bookingId: booking.id, ancillaryServiceId: service.id, quantity: 1, details: {} }); toast.success("Đã thêm dịch vụ vào tổng thanh toán."); await onRefresh(); } catch (error) { toast.error(getErrorMessage(error, "Không thể thêm dịch vụ.")); } finally { setBusy(false); } };
  return <Panel icon={Plane} title="Dịch vụ bổ sung"><div className="space-y-2">{(booking.booking_ancillaries ?? []).map((item) => <div className="flex justify-between rounded-lg bg-surface-container p-3" key={item.id}><span>{item.service?.name}</span><span>{formatCurrency(Number(item.price_snapshot) * item.quantity)}</span></div>)}{services.filter((item) => !existingIds.has(item.id)).map((item) => <button className="flex w-full items-center justify-between rounded-lg border border-outline-variant p-3 text-left hover:border-primary" disabled={busy} key={item.id} onClick={() => add(item)} type="button"><span><strong>{item.name}</strong><small className="block text-on-surface-variant">{item.description}</small></span><span>{formatCurrency(item.price)}</span></button>)}</div></Panel>;
}

function Panel({ icon: Icon, title, children }) { return <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-container-padding shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-title-lg text-primary"><Icon className="h-5 w-5" />{title}</h2>{children}</section>; }
const smallButton = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary px-3 text-sm font-semibold text-primary disabled:opacity-50";
const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50";
