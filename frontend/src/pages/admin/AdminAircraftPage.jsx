import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Settings, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminAircraftPage = () => {
  const [aircrafts, setAircrafts] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ airline_id: '', code: '', model: '', total_seats: 180 });

  const loadData = async () => {
    try {
      const res = await api.get('/aircrafts');
      setAircrafts(res.data.data);

      const airRes = await api.get('/airlines');
      setAirlines(airRes.data.data);

      if (airRes.data.data.length > 0) {
        setFormData(prev => ({ ...prev, airline_id: airRes.data.data[0].id }));
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách tàu bay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (ac) => {
    setEditingId(ac.id);
    setFormData({
      airline_id: ac.airline_id,
      code: ac.code,
      model: ac.model,
      total_seats: ac.total_seats
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ 
      airline_id: airlines[0]?.id || '', 
      code: '', 
      model: '', 
      total_seats: 180 
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.airline_id || !formData.code || !formData.model || !formData.total_seats) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/aircrafts/${editingId}`, formData);
        toast.success('Cập nhật tàu bay thành công!');
      } else {
        await api.post('/admin/aircrafts', formData);
        toast.success('Thêm tàu bay mới thành công!');
      }
      handleCancelEdit();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu thông tin tàu bay');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tàu bay này?')) return;
    try {
      await api.delete(`/admin/aircrafts/${id}`);
      toast.success('Xóa tàu bay thành công!');
      loadData();
    } catch (error) {
      toast.error('Không thể xóa tàu bay đang có chuyến bay');
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
          <h3 className="text-lg font-bold text-white">Danh sách Tàu bay</h3>
          {!showAddForm && !editingId && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm tàu bay</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/20">
                <th className="py-3 px-4">Mã hiệu</th>
                <th className="py-3 px-4">Model tàu bay</th>
                <th className="py-3 px-4">Hãng sở hữu</th>
                <th className="py-3 px-4">Tổng số ghế</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {aircrafts.map((ac) => (
                <tr key={ac.id} className="hover:bg-slate-850/40 text-slate-350">
                  <td className="py-3 px-4 font-mono font-bold text-white">{ac.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{ac.model}</td>
                  <td className="py-3 px-4">{ac.airline?.name} ({ac.airline?.code})</td>
                  <td className="py-3 px-4">{ac.total_seats} ghế</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(ac)}
                        className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ac.id)}
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
              <h4 className="font-bold text-white">{editingId ? 'Chỉnh sửa tàu bay' : 'Thêm tàu bay mới'}</h4>
              <button onClick={handleCancelEdit} className="p-1 text-slate-450 hover:text-white rounded hover:bg-slate-800 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Hãng hàng không sở hữu *</label>
                <select
                  name="airline_id"
                  value={formData.airline_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, airline_id: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none cursor-pointer"
                >
                  {airlines.map(al => (
                    <option key={al.id} value={al.id}>{al.name} ({al.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Mã đăng ký tàu bay *</label>
                <input
                  type="text"
                  required
                  placeholder="VN-A321, VJ-B737"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Dòng máy bay (Model) *</label>
                <input
                  type="text"
                  required
                  placeholder="Airbus A321 Neo, Boeing 737 Max"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Tổng số ghế thiết kế *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.total_seats}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_seats: parseInt(e.target.value) || 180 }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none placeholder-slate-655"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Lưu tàu bay</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-805 rounded-2xl p-6 text-center text-slate-500 py-16">
            <Settings className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm">Chọn chỉnh sửa tàu bay hoặc click "Thêm tàu bay" để bổ sung tàu bay mới.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAircraftPage;
