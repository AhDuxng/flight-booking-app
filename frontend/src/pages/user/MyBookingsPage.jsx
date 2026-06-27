import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../../store/bookingStore.jsx';
import { Plane, Calendar, User, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const MyBookingsPage = () => {
  const { getMyBookings } = useBookings();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const list = await getMyBookings();
        setBookings(list);
      } catch (error) {
        console.error('Failed to load my bookings:', error);
        toast.error('Không thể tải lịch sử đặt vé');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      <h2 className="text-3xl font-extrabold text-white mb-8">Lịch sử đặt vé của tôi</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl">
          <Plane className="h-14 w-14 text-slate-700 mx-auto rotate-45 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Bạn chưa đặt vé nào</h3>
          <p className="text-sm text-slate-550 max-w-xs mx-auto mb-6">
            Hãy khám phá các hành trình và tìm chuyến bay phù hợp nhất với bạn.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            Tìm chuyến bay ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => navigate(`/booking/${booking.id}`)}
              className="bg-slate-900 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 group"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-semibold text-slate-500 uppercase tracking-wider">{booking.id.slice(0, 8)}</span>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="flex items-center space-x-4 text-white font-bold text-lg">
                  <span>{booking.flight?.origin_airport?.city} ({booking.flight?.origin_airport?.code})</span>
                  <Plane className="h-4.5 w-4.5 text-indigo-550 rotate-90" />
                  <span>{booking.flight?.destination_airport?.city} ({booking.flight?.destination_airport?.code})</span>
                </div>

                <div className="flex items-center space-x-6 text-xs text-slate-450">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Khởi hành: {new Date(booking.flight?.departure_time).toLocaleDateString('vi-VN')}</span>
                  </span>
                  <span>Vé: {booking.flight?.flight_number}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-800 sm:border-0 pt-4 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-550 block">Tổng tiền</span>
                  <span className="font-extrabold text-white text-lg">{formatPrice(booking.total_price)}</span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg group-hover:border-slate-700 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
