import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { MessageSquare, Star, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const AdminReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data.data);
    } catch (error) {
      // fallback to some list
      try {
        const res = await api.get('/reviews'); // public reviews lookup
        setReviews(res.data.data);
      } catch (err) {
        toast.error('Lỗi tải danh sách nhận xét');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleVisibility = async (id, currentVal) => {
    try {
      await api.put(`/admin/reviews/${id}`, { is_visible: !currentVal });
      toast.success(currentVal ? 'Đã ẩn bình luận thành công' : 'Đã hiện bình luận thành công');
      loadReviews();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái bình luận');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      <h3 className="text-lg font-bold text-white">Quản lý nhận xét & Đánh giá (Reviews)</h3>

      <div className="bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
              <th className="py-3 px-4">Thành viên</th>
              <th className="py-3 px-4">Chuyến bay</th>
              <th className="py-3 px-4">Đánh giá</th>
              <th className="py-3 px-4">Bình luận</th>
              <th className="py-3 px-4">Ngày tạo</th>
              <th className="py-3 px-4">Hiển thị</th>
              <th className="py-3 px-4 text-right">Ẩn / Hiện</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">Chưa có đánh giá nào được ghi nhận</td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/40 text-slate-350">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{r.user?.full_name || 'Hành khách'}</td>
                  <td className="py-3.5 px-4 text-xs font-mono">{r.flight?.flight_number || 'N/A'}</td>
                  <td className="py-3.5 px-4">{renderStars(r.rating)}</td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-400">{r.comment || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-xs">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      r.is_visible ? 'bg-emerald-950 text-emerald-450 border border-emerald-900' : 'bg-slate-950 text-slate-500 border border-slate-900'
                    }`}>
                      {r.is_visible ? 'Hiển thị' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleVisibility(r.id, r.is_visible)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        r.is_visible 
                          ? 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-850'
                          : 'bg-indigo-950 text-indigo-400 border-indigo-900 hover:bg-indigo-900 hover:text-white'
                      }`}
                    >
                      {r.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminReviewPage;
