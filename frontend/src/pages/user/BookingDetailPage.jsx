import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBookings } from '../../store/bookingStore.jsx';
import { 
  Plane, Calendar, User, ShoppingBag, Coffee, ArrowLeft, 
  CreditCard, Printer, CheckCircle, HelpCircle, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBookingDetails, cancelBooking } = useBookings();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchDetails = async () => {
    try {
      const details = await getBookingDetails(id);
      setBooking(details);
    } catch (error) {
      console.error('Failed to load booking details:', error);
      toast.error('Không thể tìm thấy chi tiết đặt chỗ');
      navigate('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ này? Các khoản phí sẽ được xem xét hoàn trả tùy theo chính sách.')) {
      return;
    }
    
    setCancelling(true);
    try {
      await cancelBooking(id);
      toast.success('Hủy đặt chỗ thành công! Ghế của bạn đã được giải phóng.');
      await fetchDetails();
    } catch (error) {
      toast.error(error.message || 'Lỗi hủy đặt chỗ');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'Chờ thanh toán', class: 'bg-amber-950/60 text-amber-400 border-amber-900' },
      paid: { label: 'Đã thanh toán', class: 'bg-emerald-950/60 text-emerald-400 border-emerald-900' },
      confirmed: { label: 'Đã xác nhận', class: 'bg-emerald-950 text-emerald-450 border-emerald-900' },
      cancelled: { label: 'Đã hủy bỏ', class: 'bg-slate-900 text-slate-500 border-slate-800' },
      refunded: { label: 'Đã hoàn tiền', class: 'bg-rose-950/30 text-rose-400 border-rose-900' }
    };
    const c = configs[status] || { label: status, class: 'bg-slate-900 text-slate-400' };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${c.class}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200 print:bg-white print:text-black print:py-0 print:px-0">
      
      {/* Back button (hide on print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button 
          onClick={() => navigate('/my-bookings')} 
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Quay lại danh sách đặt vé</span>
        </button>
        
        <div className="flex space-x-2">
          {(booking.status === 'confirmed' || booking.status === 'paid') && (
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 text-xs bg-slate-900 hover:bg-slate-850 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In vé điện tử</span>
            </button>
          )}
          
          {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'paid') && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="text-xs bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-900 disabled:opacity-50 cursor-pointer"
            >
              {cancelling ? 'Đang hủy...' : 'Hủy đặt chỗ'}
            </button>
          )}
        </div>
      </div>

      {/* Ticket Details wrapper */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl print:border-0 print:shadow-none print:p-0">
        
        {/* Ticket Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 space-y-4 sm:space-y-0">
          <div>
            <span className="text-[10px] text-slate-550 block uppercase tracking-wider">Mã đặt chỗ</span>
            <h1 className="text-2xl font-black text-white font-mono uppercase tracking-wide select-all">{booking.id}</h1>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(booking.status)}
          </div>
        </div>

        {/* Flight route itinerary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950 p-6 rounded-2xl border border-slate-850">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Điểm xuất phát</span>
            <p className="text-xl font-bold text-white">
              {new Date(booking.flight?.departure_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-semibold text-slate-300">{booking.flight?.origin_airport?.city} ({booking.flight?.origin_airport?.code})</p>
            <p className="text-xs text-slate-500">{booking.flight?.origin_airport?.name}</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 md:py-0">
            <span className="text-xs text-slate-500 font-semibold">{booking.flight?.flight_number}</span>
            <div className="w-full flex items-center space-x-2 my-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <div className="h-px flex-grow bg-slate-800 border-dashed border-t border-slate-700" />
              <Plane className="h-4.5 w-4.5 text-indigo-500 rotate-90" />
              <div className="h-px flex-grow bg-slate-800 border-dashed border-t border-slate-700" />
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider capitalize">{booking.flight?.airline?.name}</span>
          </div>

          <div className="space-y-1 text-left md:text-right">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Điểm đến</span>
            <p className="text-xl font-bold text-white">
              {new Date(booking.flight?.arrival_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-semibold text-slate-300">{booking.flight?.destination_airport?.city} ({booking.flight?.destination_airport?.code})</p>
            <p className="text-xs text-slate-500">{booking.flight?.destination_airport?.name}</p>
          </div>
        </div>

        {/* Passengers list card */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-400" />
            <span>Danh sách hành khách</span>
          </h3>

          <div className="divide-y divide-slate-850 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
            {booking.passengers?.map((p, idx) => {
              // Find matching seat
              const seatLink = booking.booking_seats?.find(s => s.passenger_id === p.id);
              const baggageLink = booking.booking_baggage?.find(b => b.passenger_id === p.id);
              const mealLink = booking.booking_meals?.find(m => m.passenger_id === p.id);

              return (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-white">{p.last_name} / {p.first_name}</p>
                    <p className="text-xs text-slate-500">
                      Ngày sinh: {new Date(p.date_of_birth).toLocaleDateString('vi-VN')} &bull; Quốc tịch: {p.nationality} &bull; Loại: <span className="capitalize">{p.passenger_type}</span>
                    </p>
                  </div>
                  
                  {/* Selected items */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-indigo-950 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-900">
                      Ghế: {seatLink?.seat?.seat_number || 'Chưa chọn'}
                    </span>
                    {baggageLink && (
                      <span className="text-xs bg-slate-900 text-slate-350 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1">
                        <ShoppingBag className="h-3 w-3" />
                        <span>+{baggageLink.baggage_option?.weight_kg}kg</span>
                      </span>
                    )}
                    {mealLink && (
                      <span className="text-xs bg-slate-900 text-slate-350 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1">
                        <Coffee className="h-3 w-3" />
                        <span>Suất ăn ({mealLink.meal_option?.name})</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-800 pt-8">
          
          {/* payment details */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-indigo-400" />
              <span>Thông tin thanh toán</span>
            </h4>
            
            {booking.payments && booking.payments.length > 0 ? {
              success: (
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Mã giao dịch:</span>
                    <span className="font-mono text-slate-200">{booking.payments[0].transaction_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cổng thanh toán:</span>
                    <span className="uppercase text-slate-200">{booking.payments[0].provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày thanh toán:</span>
                    <span className="text-slate-200">{new Date(booking.payments[0].paid_at).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-850 text-sm">
                    <span className="font-bold text-slate-300">Trạng thái:</span>
                    <span className="text-emerald-450 font-bold flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Thành công</span>
                    </span>
                  </div>
                </div>
              ),
              pending: (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Yêu cầu thanh toán đang chờ xử lý.</p>
                  <Link
                    to={`/payment?booking_id=${booking.id}`}
                    className="w-full text-center block bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    Thanh toán ngay bây giờ
                  </Link>
                </div>
              ),
              failed: (
                <div className="space-y-3">
                  <p className="text-xs text-rose-450 flex items-center space-x-1.5">
                    <XCircle className="h-4 w-4" />
                    <span>Lần giao dịch gần nhất thất bại.</span>
                  </p>
                  <Link
                    to={`/payment?booking_id=${booking.id}`}
                    className="w-full text-center block bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    Thử thanh toán lại
                  </Link>
                </div>
              )
            }[booking.payments[0].status] || <span className="text-xs text-slate-500">Chưa có giao dịch thành công</span> : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Chưa ghi nhận giao dịch nào.</p>
                {booking.status === 'pending' && (
                  <Link
                    to={`/payment?booking_id=${booking.id}`}
                    className="w-full text-center block bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    Thực hiện thanh toán
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* total price details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Tổng cộng</h4>
            
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Giá vé máy bay gốc:</span>
                <span className="text-slate-200">{formatPrice(Number(booking.price_snapshot) * booking.passengers?.length)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí dịch vụ chọn ghế & tiện ích thêm:</span>
                <span className="text-slate-200">
                  {formatPrice(
                    Number(booking.total_price) - (Number(booking.price_snapshot) * booking.passengers?.length) + (booking.booking_discounts?.[0]?.discount_amount ? Number(booking.booking_discounts[0].discount_amount) : 0)
                  )}
                </span>
              </div>
              {booking.booking_discounts?.[0] && (
                <div className="flex justify-between text-rose-400">
                  <span>Mã giảm giá đã áp dụng:</span>
                  <span>-{formatPrice(booking.booking_discounts[0].discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base border-t border-slate-800 pt-3 text-white">
                <span className="font-bold">Tổng số tiền:</span>
                <span className="text-xl font-extrabold text-indigo-400">{formatPrice(booking.total_price)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default BookingDetailPage;
