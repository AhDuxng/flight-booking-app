import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/authStore.jsx';
import { User, Phone, Save, Calendar, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const { profile, updateProfile, loading } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    nationality: 'Việt Nam',
    passport_number: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || 'male',
        nationality: profile.nationality || 'Việt Nam',
        passport_number: profile.passport_number || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      toast.error(error.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      <h2 className="text-3xl font-extrabold text-white mb-8">Hồ sơ cá nhân</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card Summary */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <div className="h-24 w-24 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-3xl mx-auto border border-indigo-550 shadow-lg shadow-indigo-600/20">
            {formData.full_name ? formData.full_name[0].toUpperCase() : '?'}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{formData.full_name || 'Hành khách chưa đặt tên'}</h3>
            <p className="text-xs text-slate-450 mt-1">{profile?.id ? `ID: ${profile.id.slice(0, 8)}...` : ''}</p>
          </div>
        </div>

        {/* Profile Editing Form */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3 flex items-center space-x-2">
              <User className="h-5 w-5 text-indigo-400" />
              <span>Thông tin cá nhân</span>
            </h3>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Họ và tên *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-550" />
                  <input
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-555" />
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* DoB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ngày sinh</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-550" />
                  <input
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            {/* Nationality & Passport */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Quốc tịch</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-550" />
                  <input
                    name="nationality"
                    type="text"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Số hộ chiếu (Passport)</label>
                <input
                  name="passport_number"
                  type="text"
                  value={formData.passport_number}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Nhập nếu có"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-850">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-750 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-98 transition-all cursor-pointer"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5" />
                    <span>Lưu thay đổi</span>
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

export default ProfilePage;
