import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { ShieldCheck, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPaymentListPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data.data);
      } catch (error) {
        // Fallback to simple mock or fetch
        try {
          const res = await api.get('/payments');
          setPayments(res.data.data);
        } catch (err) {
          toast.error('Lỗi tải danh sách giao dịch');
        }
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'Chờ xử lý', class: 'bg-amber-950 text-amber-450 border-amber-900' },
      success: { label: 'Thành công', class: 'bg-emerald-950 text-emerald-400 border-emerald-900' },
      failed: { label: 'Thất bại', class: 'bg-rose-950/20 text-rose-455 border-rose-900' },
      refunded: { label: 'Đã hoàn tiền', class: 'bg-slate-950 text-slate-500 border-slate-900' }
    };
    const c = configs[status] || { label: status, class: 'bg-slate-900 text-slate-400' };
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${c.class}`}>
        {c.label}
      </span>
    );
  };

  const filteredPayments = payments.filter(
    p => p.transaction_ref?.toLowerCase().includes(search.toLowerCase()) || 
         p.booking_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white">Quản lý Giao dịch (Payments)</h3>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm mã giao dịch, mã đơn vé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none placeholder-slate-655"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
              <th className="py-3 px-4">Mã giao dịch</th>
              <th className="py-3 px-4">Mã đơn vé</th>
              <th className="py-3 px-4">Cổng thanh toán</th>
              <th className="py-3 px-4">Số tiền</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">Không tìm thấy giao dịch nào</td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-850/40 text-slate-350">
                  <td className="py-3.5 px-4 font-mono text-xs text-white select-all">{p.transaction_ref || 'N/A'}</td>
                  <td className="py-3.5 px-4 font-mono text-xs select-all">{p.booking_id.slice(0, 8)}...</td>
                  <td className="py-3.5 px-4 uppercase font-semibold text-slate-200">{p.provider}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{formatPrice(p.amount)}</td>
                  <td className="py-3.5 px-4 text-xs flex items-center space-x-1.5 mt-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{p.paid_at ? new Date(p.paid_at).toLocaleString('vi-VN') : new Date(p.created_at).toLocaleString('vi-VN')}</span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminPaymentListPage;
