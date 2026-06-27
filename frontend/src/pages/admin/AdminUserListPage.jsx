import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { Users, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const AdminUserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.data);
      } catch (error) {
        toast.error('Lỗi tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    u => (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
         (u.phone || '').toLowerCase().includes(search.toLowerCase())
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
        <h3 className="text-lg font-bold text-white">Quản lý Thành viên</h3>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-550" />
          <input
            type="text"
            placeholder="Tìm theo Tên, Số điện thoại..."
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
              <th className="py-3 px-4">Ảnh</th>
              <th className="py-3 px-4">Họ và tên</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Quốc tịch</th>
              <th className="py-3 px-4">Passport</th>
              <th className="py-3 px-4 text-right">Xem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">Không tìm thấy thành viên nào</td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/40 text-slate-350">
                  <td className="py-3.5 px-4">
                    <div className="h-8 w-8 rounded-full bg-indigo-650 flex items-center justify-center text-white font-bold text-sm">
                      {u.full_name ? u.full_name[0].toUpperCase() : '?'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{u.full_name || 'Chưa cập nhật'}</td>
                  <td className="py-3.5 px-4">{u.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4">{u.nationality || 'N/A'}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{u.passport_number || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
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

export default AdminUserListPage;
