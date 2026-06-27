import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlights } from '../../store/flightStore.jsx';
import api from '../../services/api.js';
import { Plane, Calendar, Users, Search, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

export const HomePage = () => {
  const { searchFlights, searchParams } = useFlights();
  const navigate = useNavigate();

  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [formData, setFormData] = useState({
    origin: searchParams.origin || '',
    destination: searchParams.destination || '',
    departure_date: searchParams.departure_date || '',
    passengers: searchParams.passengers || '',
    seat_class: searchParams.seat_class || ''
  });

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await api.get('/airports');
        setAirports(response.data.data);
      } catch (error) {
        console.error('Failed to load airports:', error);
        toast.error('Không thể tải danh sách sân bay');
      } finally {
        setLoadingAirports(false);
      }
    };
    fetchAirports();
  }, []);

  const handleSwap = () => {
    if (!formData.origin || !formData.destination) return;
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.origin) {
      toast.error('Vui lòng chọn điểm đi!');
      return;
    }
    if (!formData.destination) {
      toast.error('Vui lòng chọn điểm đến!');
      return;
    }
    if (formData.origin === formData.destination) {
      toast.error('Điểm khởi hành và điểm đến không thể trùng nhau!');
      return;
    }
    if (!formData.departure_date) {
      toast.error('Vui lòng chọn ngày khởi hành!');
      return;
    }
    if (!formData.passengers || formData.passengers < 1) {
      toast.error('Vui lòng nhập số lượng hành khách hợp lệ!');
      return;
    }
    if (!formData.seat_class) {
      toast.error('Vui lòng chọn hạng ghế!');
      return;
    }
    try {
      await searchFlights(formData);
      navigate('/flights');
    } catch (error) {
      toast.error(error.message || 'Lỗi tìm kiếm chuyến bay');
    }
  };

  const quickRoutes = [
    { from: 'HAN', to: 'SGN', fromCity: 'Hà Nội', toCity: 'TP. Hồ Chí Minh', price: '1,250,000đ' },
    { from: 'SGN', to: 'DAD', fromCity: 'TP. Hồ Chí Minh', toCity: 'Đà Nẵng', price: '890,000đ' },
    { from: 'HAN', to: 'DAD', fromCity: 'Hà Nội', toCity: 'Đà Nẵng', price: '950,000đ' }
  ];

  const selectRoute = (from, to) => {
    setFormData(prev => ({
      ...prev,
      origin: from,
      destination: to
    }));
    toast.success(`Đã chọn chặng bay: ${from} - ${to}`);
  };

  return (
    <div className="relative bg-slate-950 pb-20 overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)]" />

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-100 bg-clip-text text-transparent">
          Khám Phá Thế Giới Cùng Bạn
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
          Đặt vé máy bay trực tuyến nhanh chóng, tìm kiếm chặng bay tối ưu cùng mức giá ưu đãi nhất.
        </p>
      </div>

      {/* Search Widget */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
              
              {/* Origin */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Điểm đi</label>
                <div className="relative">
                  <Plane className="absolute left-3.5 top-3.5 h-5 w-5 text-indigo-400 rotate-45" />
                  <select
                    disabled={loadingAirports}
                    value={formData.origin}
                    onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                  >
                    {loadingAirports ? (
                      <option value="">Đang tải sân bay...</option>
                    ) : (
                      <>
                        <option value="">Chọn điểm đi</option>
                        {airports
                          .filter(ap => ap.code !== formData.destination)
                          .map(ap => (
                            <option key={ap.id} value={ap.code}>{ap.city} ({ap.code}) - {ap.name}</option>
                          ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center pt-5">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-3 bg-slate-850 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-full border border-slate-700/50 transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowLeftRight className="h-5 w-5 rotate-90 md:rotate-0" />
                </button>
              </div>

              {/* Destination */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Điểm đến</label>
                <div className="relative">
                  <Plane className="absolute left-3.5 top-3.5 h-5 w-5 text-indigo-400 rotate-135" />
                  <select
                    disabled={loadingAirports}
                    value={formData.destination}
                    onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                  >
                    {loadingAirports ? (
                      <option value="">Đang tải sân bay...</option>
                    ) : (
                      <>
                        <option value="">Chọn điểm đến</option>
                        {airports
                          .filter(ap => ap.code !== formData.origin)
                          .map(ap => (
                            <option key={ap.id} value={ap.code}>{ap.city} ({ap.code}) - {ap.name}</option>
                          ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ngày khởi hành</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-5 w-5 text-indigo-400" />
                  <input
                    type={formData.departure_date ? 'date' : 'text'}
                    placeholder="Chọn ngày khởi hành"
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.departure_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, departure_date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hành khách</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3.5 h-5 w-5 text-indigo-400" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Chọn số lượng hành khách"
                    value={formData.passengers}
                    onChange={(e) => setFormData(prev => ({ ...prev, passengers: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Class */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hạng ghế</label>
                <div className="relative">
                  <Plane className="absolute left-3.5 top-3.5 h-5 w-5 text-indigo-400" />
                  <select
                    value={formData.seat_class}
                    onChange={(e) => setFormData(prev => ({ ...prev, seat_class: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Chọn hạng ghế</option>
                    <option value="economy">Economy (Phổ thông)</option>
                    <option value="business">Business (Thương gia)</option>
                    <option value="first">First Class (Hạng nhất)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <Search className="h-5 w-5" />
                <span>Tìm kiếm chuyến bay</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Featured Routes */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-6">Chặng bay phổ biến</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quickRoutes.map((route, index) => (
            <div
              key={index}
              onClick={() => selectRoute(route.from, route.to)}
              className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 group"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs bg-indigo-950 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-900">Vé một chiều</span>
                <span className="text-sm font-semibold text-indigo-400 group-hover:text-indigo-300">Từ {route.price}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-100 font-bold text-lg">
                <span>{route.fromCity}</span>
                <Plane className="h-4 w-4 text-indigo-500 rotate-90" />
                <span>{route.toCity}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Mã chặng: {route.from} - {route.to}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
