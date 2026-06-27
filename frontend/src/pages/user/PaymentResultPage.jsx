import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react';

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const status = searchParams.get('status');
  const navigate = useNavigate();

  const isSuccess = status === 'success';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Glow graphics */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(${
        isSuccess ? '16,185,129,0.03' : '244,63,94,0.03'
      },0.05),transparent_50%)]`} />

      <div className="max-w-md w-full relative z-10 text-center space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        {/* Status Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
          ) : (
            <XCircle className="h-16 w-16 text-rose-500 animate-pulse" />
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white">
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h2>
          <p className="text-sm text-slate-400">
            {isSuccess 
              ? 'Yêu cầu thanh toán của bạn đã được đối tác xác nhận thành công. Chuyến bay của bạn đã sẵn sàng!'
              : 'Giao dịch không thành công do lỗi hệ thống hoặc bạn đã hủy giao dịch.'
            }
          </p>
        </div>

        {/* Booking Ref */}
        {bookingId && (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-1.5 text-sm">
            <span className="text-xs text-slate-500 block uppercase tracking-wider">Mã đơn đặt chỗ</span>
            <span className="font-mono font-bold text-slate-200 select-all">{bookingId}</span>
          </div>
        )}

        {/* Actions buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-850">
          {isSuccess ? (
            <>
              <button
                onClick={() => navigate(`/booking/${bookingId}`)}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Xem chi tiết vé</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/payment?booking_id=${bookingId}`)}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-660 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Thử thanh toán lại</span>
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl py-3.5 transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Trang chủ</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentResultPage;
