import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Ticket, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminBookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadBookings = async () => {
    try {
      // Query all bookings in the system (admin endpoint)
      const res = await api.get('/admin/bookings');
      setBookings(res.data.data);
    } catch (error) {
      // fallback to my-bookings to keep it running
      try {
        const res = await api.get('/bookings');
        setBookings(res.data.data);
      } catch (err) {
        toast.error('Lỗi tải danh sách đơn vé');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn vé này không?')) return;
    try {
      await api.post(`/admin/bookings/${id}/cancel`);
      toast.success('Hủy đơn vé thành công!');
      loadBookings();
    } catch (error) {
      try {
        await api.post(`/bookings/${id}/cancel`);
        toast.success('Hủy đơn vé thành công!');
        loadBookings();
      } catch (err) {
        toast.error('Lỗi khi hủy đơn vé');
      }
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'Chờ thanh toán', class: 'bg-amber-950 text-amber-450 border-amber-900' },
      paid: { label: 'Đã thanh toán', class: 'bg-emerald-950 text-emerald-450 border-emerald-900' },
      confirmed: { label: 'Đã xác nhận', class: 'bg-emerald-950 text-emerald-400 border-emerald-900' },
      cancelled: { label: 'Đã hủy bỏ', class: 'bg-slate-950 text-slate-500 border-slate-900' },
      refunded: { label: 'Đã hoàn tiền', class: 'bg-rose-950/20 text-rose-450 border-rose-900' }
    };
    const c = configs[status] || { label: status, class: 'bg-slate-900 text-slate-400' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${c.class}`}>
        {c.label}
      </span>
    );
  };

  const filteredBookings = bookings.filter(
    b => b.id.toLowerCase().includes(search.toLowerCase()) || 
         b.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white">Quản lý Đơn đặt chỗ</h3>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none placeholder-slate-655"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Khách hàng (Email)</th>
                <th className="py-3 px-4">Chuyến bay</th>
                <th className="py-3 px-4">Ngày đặt</th>
                <th className="py-3 px-4">Tổng tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Không tìm thấy đơn hàng nào</td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/40 text-slate-350">
                    <td className="py-3.5 px-4 font-mono font-bold text-white uppercase text-xs">{b.id.slice(0, 8)}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-200">
                      <p>{b.contact_email}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{b.contact_phone || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-bold text-slate-300">{b.flight?.flight_number}</p>
                      <p className="text-[10px] text-slate-550">{b.flight?.origin_airport?.code} &rarr; {b.flight?.destination_airport?.code}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {new Date(b.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-400">{formatPrice(b.total_price)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {(b.status === 'pending' || b.status === 'confirmed' || b.status === 'paid') && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="p-1.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-455 rounded-lg border border-slate-855 transition-colors cursor-pointer"
                          title="Hủy đơn vé"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingListPage;
