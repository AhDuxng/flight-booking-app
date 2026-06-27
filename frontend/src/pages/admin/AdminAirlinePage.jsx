import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Landmark, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminAirlinePage = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', logo_url: '', country: '', is_active: true });

  const loadAirlines = async () => {
    try {
      const res = await api.get('/airlines');
      setAirlines(res.data.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách hãng bay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirlines();
  }, []);

  const handleEditClick = (al) => {
    setEditingId(al.id);
    setFormData({
      code: al.code,
      name: al.name,
      logo_url: al.logo_url || '',
      country: al.country || '',
      is_active: al.is_active
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ code: '', name: '', logo_url: '', country: '', is_active: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Vui lòng nhập tên và mã hãng bay');
      return;
    }

    try {
      if (editingId) {
        // Edit
        await api.put(`/admin/airlines/${editingId}`, formData);
        toast.success('Cập nhật hãng bay thành công!');
      } else {
        // Add
        await api.post('/admin/airlines', formData);
        toast.success('Thêm hãng bay mới thành công!');
      }
      handleCancelEdit();
      loadAirlines();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu hãng bay');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa hãng hàng không này?')) return;
    try {
      await api.delete(`/admin/airlines/${id}`);
      toast.success('Xóa hãng bay thành công!');
      loadAirlines();
    } catch (error) {
      toast.error('Không thể xóa hãng bay đang có chuyến bay');
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
          <h3 className="text-lg font-bold text-white">Danh sách Hãng hàng không</h3>
          {!showAddForm && !editingId && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm hãng bay</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Logo</th>
                <th className="py-3 px-4">Tên hãng</th>
                <th className="py-3 px-4">Quốc gia</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {airlines.map((al) => (
                <tr key={al.id} className="hover:bg-slate-850/40 text-slate-350">
                  <td className="py-3 px-4 font-mono font-bold text-white">{al.code}</td>
                  <td className="py-3 px-4">
                    {al.logo_url ? (
                      <img src={al.logo_url} alt={al.name} className="h-6 w-16 object-contain" />
                    ) : (
                      <Landmark className="h-4 w-4 text-slate-500" />
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{al.name}</td>
                  <td className="py-3 px-4">{al.country || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      al.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-slate-950 text-slate-455 border border-slate-900'
                    }`}>
                      {al.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(al)}
                        className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(al.id)}
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
              <h4 className="font-bold text-white">{editingId ? 'Chỉnh sửa hãng bay' : 'Thêm hãng bay mới'}</h4>
              <button onClick={handleCancelEdit} className="p-1 text-slate-450 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Mã hãng bay (IATA Code)</label>
                <input
                  type="text"
                  required
                  placeholder="VJ, VN, QH"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Tên hãng hàng không</label>
                <input
                  type="text"
                  required
                  placeholder="Vietjet Air, Vietnam Airlines"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Quốc gia</label>
                <input
                  type="text"
                  placeholder="Việt Nam"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded text-indigo-650 bg-slate-950 border-slate-800 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm text-slate-300 cursor-pointer">Hoạt động hành trình</label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Lưu hãng bay</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-805 rounded-2xl p-6 text-center text-slate-500 py-16">
            <Landmark className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm">Chọn chỉnh sửa hãng bay hoặc click "Thêm hãng bay" để bổ sung hãng bay mới.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAirlinePage;
