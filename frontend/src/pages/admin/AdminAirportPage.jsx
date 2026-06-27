import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Compass, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminAirportPage = () => {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', city: '', country: '', timezone: 'Asia/Ho_Chi_Minh' });

  const loadAirports = async () => {
    try {
      const res = await api.get('/airports');
      setAirports(res.data.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách sân bay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirports();
  }, []);

  const handleEditClick = (ap) => {
    setEditingId(ap.id);
    setFormData({
      code: ap.code,
      name: ap.name,
      city: ap.city,
      country: ap.country,
      timezone: ap.timezone
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ code: '', name: '', city: '', country: '', timezone: 'Asia/Ho_Chi_Minh' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.city || !formData.country) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/airports/${editingId}`, formData);
        toast.success('Cập nhật sân bay thành công!');
      } else {
        await api.post('/admin/airports', formData);
        toast.success('Thêm sân bay mới thành công!');
      }
      handleCancelEdit();
      loadAirports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu sân bay');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sân bay này?')) return;
    try {
      await api.delete(`/admin/airports/${id}`);
      toast.success('Xóa sân bay thành công!');
      loadAirports();
    } catch (error) {
      toast.error('Không thể xóa sân bay đang có chuyến bay');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-200">
      
      {/* List Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white">Danh sách Sân bay</h3>
          {!showAddForm && !editingId && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm sân bay</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
                <th className="py-3 px-4">Mã IATA</th>
                <th className="py-3 px-4">Tên sân bay</th>
                <th className="py-3 px-4">Thành phố</th>
                <th className="py-3 px-4">Quốc gia</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {airports.map((ap) => (
                <tr key={ap.id} className="hover:bg-slate-850/40 text-slate-350">
                  <td className="py-3 px-4 font-mono font-bold text-white">{ap.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{ap.name}</td>
                  <td className="py-3 px-4">{ap.city}</td>
                  <td className="py-3 px-4">{ap.country}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(ap)}
                        className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ap.id)}
                        className="p-1.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-455 rounded-lg border border-slate-855 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms Column */}
      <div className="lg:col-span-1">
        {(showAddForm || editingId) ? (
          <div className="bg-slate-900 border border-slate-805 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white">{editingId ? 'Chỉnh sửa sân bay' : 'Thêm sân bay mới'}</h4>
              <button onClick={handleCancelEdit} className="p-1 text-slate-450 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Mã sân bay (IATA Code) *</label>
                <input
                  type="text"
                  required
                  maxLength="3"
                  placeholder="SGN, HAN, DAD"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Tên sân bay *</label>
                <input
                  type="text"
                  required
                  placeholder="Sân bay Tân Sơn Nhất"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Thành phố *</label>
                <input
                  type="text"
                  required
                  placeholder="TP. Hồ Chí Minh"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Quốc gia *</label>
                <input
                  type="text"
                  required
                  placeholder="Việt Nam"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Múi giờ (Timezone)</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Lưu sân bay</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-805 rounded-2xl p-6 text-center text-slate-500 py-16">
            <Compass className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm">Chọn chỉnh sửa sân bay hoặc click "Thêm sân bay" để bổ sung sân bay mới.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAirportPage;
