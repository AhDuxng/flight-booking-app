import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { User, Phone, ArrowLeft, Calendar, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const userRes = await api.get(`/admin/users/${id}`);
        setProfile(userRes.data.data);

        // Fetch bookings for this specific user
        const bookingsRes = await api.get('/admin/bookings', { params: { user_id: id } });
        setBookings(bookingsRes.data.data.filter(b => b.user_id === id));
      } catch (error) {
        console.error('Failed to load user details:', error);
        toast.error('Lỗi tải thông tin chi tiết thành viên');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };
    loadUserDetails();
  }, [id]);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'Chờ thanh toán', class: 'bg-amber-950 text-amber-450 border-amber-900' },
      paid: { label: 'Đã thanh toán', class: 'bg-emerald-950 text-emerald-450 border-emerald-900' },
      confirmed: { label: 'Đã xác nhận', class: 'bg-emerald-950 text-emerald-400 border-emerald-900' },
      cancelled: { label: 'Đã hủy bỏ', class: 'bg-slate-950 text-slate-500 border-slate-900' },
      refunded: { label: 'Đã hoàn tiền', class: 'bg-rose-950/20 text-rose-455 border-rose-900' }
    };
    const c = configs[status] || { label: status, class: 'bg-slate-900 text-slate-400' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${c.class}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer text-slate-400">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-white">Hồ sơ chi tiết thành viên</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Info Column */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-805 rounded-3xl p-6 text-center space-y-4 h-fit">
          <div className="h-20 w-20 bg-indigo-650 rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto">
            {profile.full_name ? profile.full_name[0].toUpperCase() : '?'}
          </div>
          <div>
            <h4 className="font-bold text-white text-base">{profile.full_name || 'Chưa cập nhật tên'}</h4>
            <p className="text-xs text-slate-500 mt-1">ID: {profile.id}</p>
          </div>

          <div className="border-t border-slate-850 pt-4 space-y-3 text-left text-sm text-slate-350">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Số điện thoại</span>
              <span className="font-medium text-white">{profile.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Ngày sinh</span>
              <span className="font-medium text-white">{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Giới tính</span>
              <span className="font-medium text-white capitalize">{profile.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Quốc tịch</span>
              <span className="font-medium text-white">{profile.nationality || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Số hộ chiếu (Passport)</span>
              <span className="font-mono text-white text-xs">{profile.passport_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* User Bookings list */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-white text-base">Lịch sử đặt vé của thành viên</h3>

          <div className="bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
                  <th className="py-3 px-4">Mã vé</th>
                  <th className="py-3 px-4">Chuyến bay</th>
                  <th className="py-3 px-4">Ngày đặt</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">Chưa đặt chuyến bay nào</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-850/40 text-slate-350">
                      <td className="py-3.5 px-4 font-mono font-bold text-white uppercase text-xs">{b.id.slice(0, 8)}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-200">
                        {b.flight?.flight_number} ({b.flight?.origin_airport?.code} &rarr; {b.flight?.destination_airport?.code})
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {new Date(b.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-400">{formatPrice(b.total_price)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminUserDetailPage;
