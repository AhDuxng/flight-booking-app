import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBookings } from '../../store/bookingStore.jsx';
import { Plane, CreditCard, ShieldCheck, ArrowRight, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const navigate = useNavigate();

  const { getBookingDetails, processPayment } = useBookings();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('vnpay'); // vnpay, momo, stripe, cash
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      toast.error('Không tìm thấy đơn hàng cần thanh toán');
      navigate('/');
      return;
    }

    const loadBooking = async () => {
      try {
        const details = await getBookingDetails(bookingId);
        setBooking(details);
        
        if (details.status !== 'pending') {
          toast.info('Đơn đặt chỗ đã được thanh toán hoặc hủy bỏ');
          navigate(`/booking/${bookingId}`);
        }
      } catch (error) {
        console.error('Failed to load booking details:', error);
        toast.error('Không thể lấy thông tin thanh toán');
        navigate('/my-bookings');
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      const res = await processPayment({
        booking_id: bookingId,
        provider: provider,
        amount: Number(booking.total_price)
      });

      if (res.redirectUrl) {
        // Redirect to mock payment gateway
        // Pointing relative to backend API
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        // If redirectUrl is relative, prepend backend API URL
        const fullRedirectUrl = res.redirectUrl.startsWith('http') 
          ? res.redirectUrl 
          : `${apiBaseUrl.replace('/api/v1', '')}${res.redirectUrl}`;

        toast.loading('Đang chuyển hướng đến cổng thanh toán...');
        window.location.href = fullRedirectUrl;
      } else {
        // If no redirect URL (e.g. Cash option processed instantly)
        toast.success('Thanh toán tiền mặt được xác nhận!');
        navigate(`/payment/result?bookingId=${bookingId}&status=success`);
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi khởi tạo cổng thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!booking) return null;

  const paymentGateways = [
    { id: 'vnpay', name: 'VNPay', desc: 'Cổng thanh toán quốc gia VNPay', logo: 'https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAY.png' },
    { id: 'momo', name: 'Ví MoMo', desc: 'Thanh toán quét mã ví điện tử MoMo', logo: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png' },
    { id: 'stripe', name: 'Thẻ Quốc tế (Stripe)', desc: 'Visa, Mastercard, JCB, AMEX', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' },
    { id: 'cash', name: 'Thanh toán tiền mặt', desc: 'Thanh toán tại quầy giao dịch', logo: null }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      <h2 className="text-3xl font-extrabold text-white mb-8 text-center">Thanh toán vé máy bay</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Gateway Selectors */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              <span>Phương thức thanh toán</span>
            </h3>

            <div className="space-y-3">
              {paymentGateways.map((gw) => (
                <div
                  key={gw.id}
                  onClick={() => setProvider(gw.id)}
                  className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all ${
                    provider === gw.id
                      ? 'bg-indigo-950/20 border-indigo-500 shadow-md shadow-indigo-650/5'
                      : 'bg-slate-950 border-slate-850 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-16 bg-slate-900 rounded-lg flex items-center justify-center p-1 overflow-hidden border border-slate-800 text-xs text-slate-400 font-bold">
                      {gw.logo ? (
                        <img src={gw.logo} alt={gw.name} className="object-contain max-h-full max-w-full" />
                      ) : (
                        <Landmark className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{gw.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{gw.desc}</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    provider === gw.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'
                  }`}>
                    {provider === gw.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking & Price summary sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3">Chi tiết đơn vé</h3>
            
            <div className="space-y-4 text-sm">
              {/* Route */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">{booking.flight?.origin_airport?.code}</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
                <span className="font-bold text-white">{booking.flight?.destination_airport?.code}</span>
              </div>
              <p className="text-xs text-slate-400">Hành khách: {booking.passengers?.length} người</p>
              
              <div className="border-t border-slate-850 pt-4 flex justify-between items-center">
                <span className="text-slate-400">Số tiền cần trả</span>
                <span className="text-xl font-black text-indigo-400">{formatPrice(booking.total_price)}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 active:scale-98 cursor-pointer flex justify-center items-center space-x-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>Xác nhận thanh toán</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
