import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api.js';
import { Plane, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const AdminFlightEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    airline_id: '',
    aircraft_id: '',
    origin_airport_id: '',
    destination_airport_id: '',
    flight_number: '',
    departure_time: '',
    arrival_time: '',
    base_price: 0,
    available_seats: 0,
    status: 'scheduled'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const airlinesRes = await api.get('/airlines');
        setAirlines(airlinesRes.data.data);

        const airportsRes = await api.get('/airports');
        setAirports(airportsRes.data.data);

        const aircraftsRes = await api.get('/aircrafts');
        setAircrafts(aircraftsRes.data.data);

        const flightRes = await api.get(`/flights/${id}`);
        const f = flightRes.data.data;
        
        // Convert dates to string format datetime-local expects: YYYY-MM-DDTHH:MM
        const depStr = new Date(f.departure_time).toISOString().slice(0, 16);
        const arrStr = new Date(f.arrival_time).toISOString().slice(0, 16);

        setFormData({
          airline_id: f.airline_id,
          aircraft_id: f.aircraft_id,
          origin_airport_id: f.origin_airport_id,
          destination_airport_id: f.destination_airport_id,
          flight_number: f.flight_number,
          departure_time: depStr,
          arrival_time: arrStr,
          base_price: Number(f.base_price),
          available_seats: f.available_seats,
          status: f.status
        });
      } catch (error) {
        console.error('Failed to load edit details:', error);
        toast.error('Lỗi tải thông tin chi tiết');
        navigate('/admin/flights');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.origin_airport_id === formData.destination_airport_id) {
      toast.error('Sân bay đi và đến không được trùng nhau');
      return;
    }

    try {
      await api.put(`/admin/flights/${id}`, {
        ...formData,
        base_price: Number(formData.base_price),
        available_seats: Number(formData.available_seats)
      });
      toast.success('Cập nhật chuyến bay thành công!');
      navigate('/admin/flights');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật chuyến bay');
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
    <div className="max-w-4xl mx-auto space-y-6 text-slate-200">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate('/admin/flights')} className="p-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer text-slate-400">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-white">Chỉnh sửa chuyến bay</h3>
      </div>

      <div className="bg-slate-900 border border-slate-805 rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Airline & Aircraft */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-400">Hãng bay và Tàu bay</h4>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Hãng hàng không</label>
                <select
                  name="airline_id"
                  value={formData.airline_id}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none cursor-pointer"
                >
                  {airlines.map(al => (
                    <option key={al.id} value={al.id}>{al.name} ({al.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Tàu bay</label>
                <select
                  name="aircraft_id"
                  value={formData.aircraft_id}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none cursor-pointer"
                >
                  {aircrafts.map(ac => (
                    <option key={ac.id} value={ac.id}>{ac.model} - Sức chứa: {ac.total_seats}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Số hiệu chuyến bay</label>
                <input
                  name="flight_number"
                  type="text"
                  required
                  value={formData.flight_number}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Airports */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-400">Tuyến bay</h4>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Sân bay đi (Origin)</label>
                <select
                  name="origin_airport_id"
                  value={formData.origin_airport_id}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none cursor-pointer"
                >
                  {airports.map(ap => (
                    <option key={ap.id} value={ap.id}>{ap.city} ({ap.code}) - {ap.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Sân bay đến (Destination)</label>
                <select
                  name="destination_airport_id"
                  value={formData.destination_airport_id}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none cursor-pointer"
                >
                  {airports.map(ap => (
                    <option key={ap.id} value={ap.id}>{ap.city} ({ap.code}) - {ap.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-800 pt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-400">Lịch trình</h4>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Thời gian khởi hành (Departure)</label>
                <input
                  name="departure_time"
                  type="datetime-local"
                  required
                  value={formData.departure_time}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Thời gian hạ cánh (Arrival)</label>
                <input
                  name="arrival_time"
                  type="datetime-local"
                  required
                  value={formData.arrival_time}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-400">Giá vé & Trạng thái</h4>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Giá vé cơ bản (VND)</label>
                <input
                  name="base_price"
                  type="number"
                  min="0"
                  required
                  value={formData.base_price}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">Ghế trống</label>
                  <input
                    name="available_seats"
                    type="number"
                    min="1"
                    required
                    value={formData.available_seats}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="boarding">Boarding</option>
                    <option value="departed">Departed</option>
                    <option value="arrived">Arrived</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-850">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              <Save className="h-4.5 w-4.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default AdminFlightEditPage;
