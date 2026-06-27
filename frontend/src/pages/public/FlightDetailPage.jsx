import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlights } from '../../store/flightStore.jsx';
import api from '../../services/api.js';
import { Plane, Clock, Calendar, ShieldCheck, ShoppingBag, Coffee, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const FlightDetailPage = () => {
  const { id } = useParams();
  const { getFlightById } = useFlights();
  const navigate = useNavigate();

  const [flight, setFlight] = useState(null);
  const [baggageOptions, setBaggageOptions] = useState([]);
  const [mealOptions, setMealOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const flightData = await getFlightById(id);
        setFlight(flightData);

        // Fetch baggage options
        const baggageRes = await api.get('/baggage', { params: { flight_id: id } });
        setBaggageOptions(baggageRes.data.data);

        // Fetch meal options
        const mealRes = await api.get('/meals', { params: { flight_id: id } });
        setMealOptions(mealRes.data.data);
      } catch (error) {
        console.error('Failed to load flight details:', error);
        toast.error('Không thể tải chi tiết chuyến bay');
        navigate('/flights');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const getDuration = (dep, arr) => {
    const diffMs = new Date(arr) - new Date(dep);
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleBookNow = () => {
    navigate(`/booking/new?flight_id=${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!flight) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Quay lại danh sách</span>
      </button>

      {/* Flight Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden">
        {/* Background gradient blur */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-650/10 rounded-full blur-3xl -mr-10 -mt-10" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0 relative z-10">
          
          {/* Airline, flight number, aircraft */}
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2.5 overflow-hidden">
              {flight.airline?.logo_url ? (
                <img src={flight.airline.logo_url} alt={flight.airline.name} className="object-contain max-h-full max-w-full" />
              ) : (
                <Plane className="h-6 w-6 text-indigo-400 rotate-45" />
              )}
            </div>
            <div>
              <span className="text-xs bg-indigo-950 text-indigo-400 font-semibold px-2.5 py-1 rounded-full border border-indigo-900">
                {flight.flight_number}
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">{flight.airline?.name}</h2>
              <p className="text-xs text-slate-500 mt-1">Tàu bay: {flight.aircraft?.model} ({flight.aircraft?.code})</p>
            </div>
          </div>

          {/* Pricing & Booking action */}
          <div className="text-left md:text-right w-full md:w-auto shrink-0 space-y-3">
            <div>
              <span className="text-slate-400 text-xs block">Giá vé cơ bản</span>
              <span className="text-3xl font-black text-white">{formatPrice(flight.base_price)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Vé đã bao gồm các loại thuế phí cơ bản</span>
            </div>
            <button
              onClick={handleBookNow}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-98 cursor-pointer"
            >
              Đặt vé ngay
            </button>
          </div>
        </div>

        {/* Detailed Timeline Schedule */}
        <div className="border-t border-slate-800 mt-8 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* Departure */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Khởi hành</span>
            <p className="text-2xl font-bold text-white">
              {new Date(flight.departure_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-semibold text-slate-300">
              {flight.origin_airport?.city} ({flight.origin_airport?.code})
            </p>
            <p className="text-xs text-slate-500">{flight.origin_airport?.name}</p>
            <p className="text-[10px] text-slate-500">{new Date(flight.departure_time).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Duration Graphic */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>{getDuration(flight.departure_time, flight.arrival_time)}</span>
            </span>
            <div className="w-full flex items-center space-x-2 my-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <div className="h-px flex-grow bg-slate-800 border-dashed border-t border-slate-700" />
              <Plane className="h-5 w-5 text-indigo-500 rotate-90" />
              <div className="h-px flex-grow bg-slate-800 border-dashed border-t border-slate-700" />
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
            </div>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-950/40 px-3 py-0.5 rounded-full border border-indigo-900">Bay thẳng</span>
          </div>

          {/* Arrival */}
          <div className="space-y-1 text-left sm:text-right">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Điểm đến</span>
            <p className="text-2xl font-bold text-white">
              {new Date(flight.arrival_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-semibold text-slate-300">
              {flight.destination_airport?.city} ({flight.destination_airport?.code})
            </p>
            <p className="text-xs text-slate-500">{flight.destination_airport?.name}</p>
            <p className="text-[10px] text-slate-500">{new Date(flight.arrival_time).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Baggage Addons info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            <span>Gói hành lý ký gửi kèm theo</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Bạn có thể chọn mua thêm các gói hành lý ký gửi ký gửi trong quá trình đặt vé.</p>
          <div className="space-y-3">
            {baggageOptions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Không có gói hành lý đi kèm cho chuyến bay này</p>
            ) : (
              baggageOptions.map((opt) => (
                <div key={opt.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <div>
                    <p className="font-bold text-slate-200">Gói {opt.weight_kg} kg</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description || 'Hành lý ký gửi kèm theo'}</p>
                  </div>
                  <span className="font-semibold text-indigo-400 text-sm">{formatPrice(opt.price)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Meal Addons info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Coffee className="h-5 w-5 text-indigo-400" />
            <span>Suất ăn phục vụ trên chuyến bay</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Các bữa ăn nóng hấp dẫn có sẵn cho hành trình bay của bạn.</p>
          <div className="space-y-3">
            {mealOptions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Không phục vụ món ăn cho chuyến bay này</p>
            ) : (
              mealOptions.map((opt) => (
                <div key={opt.id} className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <div>
                    <p className="font-bold text-slate-200">{opt.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description || 'Món ăn nóng ngon miệng'} &bull; <span className="capitalize">{opt.meal_type}</span></p>
                  </div>
                  <span className="font-semibold text-indigo-400 text-sm">{formatPrice(opt.price)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default FlightDetailPage;
