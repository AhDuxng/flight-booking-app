import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.jsx';
import { Plane, Mail, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_50%)] animate-pulse" />

      <div className="max-w-md w-full relative z-10 space-y-8">
        
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
            <Plane className="h-6 w-6 rotate-45" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Đăng nhập tài khoản</h2>
          <p className="mt-2 text-sm text-slate-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Login form card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Địa chỉ email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mật khẩu</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                />
              </div>
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-750 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
