import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore.jsx';
import { Plane, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const RegisterPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    nationality: 'Việt Nam',
    passport_number: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Vui lòng điền các thông tin bắt buộc (*)');
      return;
    }
    
    setLoading(true);
    try {
      await signup(formData);
      toast.success('Đăng ký tài khoản thành công! Hãy đăng nhập.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Lỗi đăng ký tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_50%)]" />

      <div className="max-w-2xl w-full relative z-10 space-y-8">
        
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
            <Plane className="h-6 w-6 rotate-45" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Tạo tài khoản mới</h2>
          <p className="mt-2 text-sm text-slate-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Account Credentials */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">1. Thông tin đăng nhập</h3>
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Địa chỉ email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Mật khẩu *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider block">Họ và tên *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      name="full_name"
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Passenger Metadata details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">2. Thông tin cá nhân</h3>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="09xxxxxxxx"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Ngày sinh</label>
                    <input
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Giới tính</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Nationality & Passport */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Quốc tịch</label>
                    <input
                      name="nationality"
                      type="text"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Số hộ chiếu (Passport)</label>
                    <input
                      name="passport_number"
                      type="text"
                      placeholder="Nhập nếu có"
                      value={formData.passport_number}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-slate-800 pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-750 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Đăng ký ngay</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
