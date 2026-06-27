import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore.jsx';
import { useNotifications } from '../store/notificationStore.jsx';
import { Plane, User, LogOut, Bell, Menu, X, ShieldAlert } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { unreadCount, fetchNotifications, notifications } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll notifications every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors">
            <Plane className="h-8 w-8 rotate-45" />
            <span className="font-extrabold text-xl tracking-wider text-indigo-900">PHENIKAA DREAM FLIGHTS</span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-slate-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">Tìm chuyến bay</Link>
            
            {isAuthenticated && (
              <>
                <Link to="/my-bookings" className="text-slate-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">Vé của tôi</Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-md font-medium transition-colors">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Quản trị viên</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all cursor-pointer relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-200 divide-y divide-slate-850">
                      <div className="px-4 py-2 font-semibold text-white flex justify-between items-center">
                        <span>Thông báo ({unreadCount})</span>
                        <button onClick={() => setNotifOpen(false)} className="text-xs text-slate-400 hover:text-white">Đóng</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-slate-400">Không có thông báo mới</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`px-4 py-3 text-sm hover:bg-slate-850 transition-colors ${!n.read_at ? 'bg-slate-850/40' : ''}`}>
                              <p className="font-semibold text-white">{n.title}</p>
                              <p className="text-xs text-slate-300 mt-1">{n.body}</p>
                              <p className="text-[10px] text-slate-500 mt-1.5">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-between text-white font-bold text-center text-sm">
                      <span className="w-full text-center">{user.email[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-200">{user.email}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
                      <Link 
                        to="/profile" 
                        onClick={() => setDropdownOpen(false)} 
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-850 hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-rose-400 hover:bg-slate-850 hover:text-rose-300 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-indigo-400 px-3 py-2 text-sm font-medium transition-colors">Đăng nhập</Link>
                <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/25">Đăng ký</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <button onClick={() => setNotifOpen(!notifOpen)} className="p-2 text-slate-400 hover:text-white rounded-full relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />}
              </button>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-2 pt-2 pb-4 space-y-1">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Tìm chuyến bay</Link>
          {isAuthenticated ? (
            <>
              <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Vé của tôi</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Hồ sơ cá nhân</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-400 hover:bg-slate-800">Quản trị viên</Link>
              )}
              <button 
                onClick={handleLogout} 
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-slate-800 hover:text-rose-300"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="pt-4 flex flex-col space-y-2 px-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 text-slate-300 hover:bg-slate-800 hover:text-indigo-400 rounded-md font-medium">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-medium text-white shadow-lg shadow-indigo-600/10">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
