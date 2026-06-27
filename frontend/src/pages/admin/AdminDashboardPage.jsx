import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { 
  Users, Plane, Ticket, Landmark, Landmark as RevenueIcon, ShieldAlert 
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState({ flights: 0, bookings: 0, users: 0, revenue: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data.data);

        const logsRes = await api.get('/admin/logs', { params: { limit: 10 } });
        setLogs(logsRes.data.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Lỗi khi tải thông số Dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Tổng Doanh thu', value: formatPrice(stats.revenue), icon: RevenueIcon, color: 'text-emerald-450 bg-emerald-950/40 border-emerald-900' },
    { title: 'Chuyến bay', value: stats.flights, icon: Plane, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-900' },
    { title: 'Đơn vé đã đặt', value: stats.bookings, icon: Ticket, color: 'text-amber-400 bg-amber-950/40 border-amber-900' },
    { title: 'Người dùng', value: stats.users, icon: Users, color: 'text-sky-400 bg-sky-950/40 border-sky-900' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-slate-900 border border-slate-805 rounded-2xl p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs text-slate-450 font-semibold block">{c.title}</span>
                <span className="text-2xl font-black text-white">{c.value}</span>
              </div>
              <div className={`p-4 rounded-xl border ${c.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Logs Table */}
      <div className="bg-slate-900 border border-slate-805 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-indigo-400" />
          <span>Nhật ký hoạt động quản lý (Admin Logs)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Loại đối tượng</th>
                <th className="py-3 px-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">Chưa ghi nhận hoạt động nào</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/40 text-slate-300">
                    <td className="py-3.5 px-4 font-mono text-xs">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{log.admin?.full_name || 'Admin'}</td>
                    <td className="py-3.5 px-4"><span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900 capitalize">{log.action}</span></td>
                    <td className="py-3.5 px-4 text-xs font-semibold uppercase text-slate-400">{log.target_type || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 truncate max-w-xs">{JSON.stringify(log.metadata)}</td>
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

export default AdminDashboardPage;
