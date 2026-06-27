import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore.jsx';
import { 
  LayoutDashboard, Plane, Ticket, Landmark, Compass, 
  Settings, ShieldCheck, Users, MessageSquare, LogOut, ArrowLeft
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, loading, logout, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Redirect to home if not logged in or not admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Chuyến bay', path: '/admin/flights', icon: Plane },
    { name: 'Đơn đặt chỗ', path: '/admin/bookings', icon: Ticket },
    { name: 'Sân bay', path: '/admin/airports', icon: Compass },
    { name: 'Hãng bay', path: '/admin/airlines', icon: Landmark },
    { name: 'Máy bay', path: '/admin/aircrafts', icon: Settings },
    { name: 'Giao dịch', path: '/admin/payments', icon: ShieldCheck },
    { name: 'Người dùng', path: '/admin/users', icon: Users },
    { name: 'Đánh giá', path: '/admin/reviews', icon: MessageSquare }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-indigo-400 mb-8">
            <ShieldCheck className="h-7 w-7" />
            <span className="font-bold text-lg text-white tracking-wider">ADMIN CONSOLE</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                      : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & exit */}
        <div className="p-6 border-t border-slate-850 space-y-3">
          <div className="text-xs text-slate-500">
            Đang đăng nhập: <p className="font-semibold text-slate-300 truncate mt-0.5">{user.email}</p>
          </div>
          <Link to="/" className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-slate-850 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại trang chủ</span>
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-10 shrink-0">
          <h1 className="text-lg font-semibold text-white">
            {menuItems.find(item => item.path === location.pathname)?.name || 'Admin Management'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-indigo-950 text-indigo-400 px-2.5 py-1 rounded-full font-semibold border border-indigo-900/50">ADMIN ROLE</span>
          </div>
        </header>

        {/* Dynamic page viewport */}
        <section className="flex-grow overflow-y-auto p-8 bg-slate-950">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
