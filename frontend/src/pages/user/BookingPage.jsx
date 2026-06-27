import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBookings } from '../../store/bookingStore.jsx';
import { useFlights } from '../../store/flightStore.jsx';
import api from '../../services/api.js';
import { Plane, User, ShoppingBag, Coffee, ChevronRight, CheckCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';

export const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const flightId = searchParams.get('flight_id');
  const navigate = useNavigate();

  const { createBooking, validateDiscount } = useBookings();
  const { getFlightById, getSeats } = useFlights();

  const [flight, setFlight] = useState(null);
  const [dbSeats, setDbSeats] = useState([]);
  const [baggageOptions, setBaggageOptions] = useState([]);
  const [mealOptions, setMealOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [passengers, setPassengers] = useState([
    {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      nationality: 'Việt Nam',
      passport_number: '',
      passenger_type: 'adult',
      seat_id: '',
      baggage_option_id: '',
      baggage_quantity: 1,
      meal_option_id: '',
      meal_quantity: 1
    }
  ]);
  
  // Coupon State
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // UI Active passenger index for selections
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);

  useEffect(() => {
    if (!flightId) {
      toast.error('Không tìm thấy thông tin chuyến bay');
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const flightData = await getFlightById(flightId);
        setFlight(flightData);

        const seatData = await getSeats(flightId);
        setDbSeats(seatData);

        const baggageRes = await api.get('/baggage', { params: { flight_id: flightId } });
        setBaggageOptions(baggageRes.data.data);

        const mealRes = await api.get('/meals', { params: { flight_id: flightId } });
        setMealOptions(mealRes.data.data);

        // Pre-fill contact details from localStorage user profile if exists
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          setContactEmail(parsed.email || '');
        }
      } catch (error) {
        console.error('Failed to load booking configurations:', error);
        toast.error('Lỗi khởi tạo luồng đặt vé');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [flightId]);

  const handleAddPassenger = () => {
    setPassengers(prev => [
      ...prev,
      {
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'male',
        nationality: 'Việt Nam',
        passport_number: '',
        passenger_type: 'adult',
        seat_id: '',
        baggage_option_id: '',
        baggage_quantity: 1,
        meal_option_id: '',
        meal_quantity: 1
      }
    ]);
  };

  const handleRemovePassenger = (index) => {
    if (passengers.length === 1) return;
    setPassengers(prev => prev.filter((_, idx) => idx !== index));
    setActivePassengerIndex(0);
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => prev.map((p, idx) => {
      if (idx === index) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleValidateDiscount = async () => {
    if (!discountCode) return;
    try {
      const value = calculateSubTotal();
      const res = await validateDiscount(discountCode, value);
      setAppliedDiscount(res);
      toast.success(`Đã áp dụng mã giảm giá! Tiết kiệm ${formatPrice(res.discount_amount)}`);
    } catch (error) {
      toast.error(error.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện');
      setAppliedDiscount(null);
    }
  };

  const calculateSubTotal = () => {
    if (!flight) return 0;
    
    const ticketCost = Number(flight.base_price) * passengers.length;
    
    let extrasCost = 0;
    passengers.forEach(p => {
      if (p.seat_id) {
        const seat = dbSeats.find(s => s.id === p.seat_id);
        if (seat) extrasCost += Number(seat.price);
      }
      if (p.baggage_option_id) {
        const bag = baggageOptions.find(b => b.id === p.baggage_option_id);
        if (bag) extrasCost += Number(bag.price) * (p.baggage_quantity || 1);
      }
      if (p.meal_option_id) {
        const meal = mealOptions.find(m => m.id === p.meal_option_id);
        if (meal) extrasCost += Number(meal.price) * (p.meal_quantity || 1);
      }
    });

    return ticketCost + extrasCost;
  };

  const calculateTotal = () => {
    const sub = calculateSubTotal();
    if (appliedDiscount) {
      return Math.max(0, sub - Number(appliedDiscount.discount_amount));
    }
    return sub;
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check forms details
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.first_name || !p.last_name || !p.date_of_birth) {
        toast.error(`Vui lòng nhập đầy đủ thông tin cho hành khách thứ ${i + 1}`);
        return;
      }
    }

    if (!contactEmail) {
      toast.error('Vui lòng nhập email liên hệ');
      return;
    }

    try {
      const payload = {
        flight_id: flightId,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        notes: notes || null,
        discount_code: appliedDiscount ? discountCode : undefined,
        passengers: passengers.map(p => ({
          ...p,
          seat_id: p.seat_id || undefined,
          baggage_option_id: p.baggage_option_id || undefined,
          meal_option_id: p.meal_option_id || undefined
        }))
      };

      const booking = await createBooking(payload);
      toast.success('Đặt vé tạm thời thành công!');
      navigate(`/payment?booking_id=${booking.id}`);
    } catch (error) {
      toast.error(error.message || 'Lỗi xử lý đặt chỗ');
    }
  };

  // Get currently selected seats by other passengers to lock them in local UI
  const getSelectedSeatsByOthers = (passengerIdx) => {
    return passengers
      .map((p, idx) => (idx !== passengerIdx ? p.seat_id : null))
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!flight) return null;

  const currentPassenger = passengers[activePassengerIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      <h2 className="text-3xl font-extrabold text-white mb-8">Thông tin đặt vé máy bay</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Forms Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Contacts Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
                <Plane className="h-5 w-5 text-indigo-400 rotate-45" />
                <span>1. Thông tin liên hệ</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email liên hệ *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="09xxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Passengers Info List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <User className="h-5 w-5 text-indigo-400" />
                  <span>2. Thông tin hành khách</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddPassenger}
                  className="text-xs bg-indigo-950 text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-lg border border-indigo-900 cursor-pointer"
                >
                  + Thêm hành khách
                </button>
              </div>

              {/* Passengers Quick Toggles */}
              <div className="flex flex-wrap gap-2">
                {passengers.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePassengerIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      activePassengerIndex === idx
                        ? 'bg-indigo-650 text-white border-indigo-600'
                        : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-850'
                    }`}
                  >
                    Hành khách {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Passenger Form */}
              <div className="space-y-4 pt-4 border-t border-slate-850 relative">
                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(activePassengerIndex)}
                    className="absolute right-0 top-0 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Xóa hành khách này
                  </button>
                )}

                <p className="text-sm font-bold text-indigo-400">Điền thông tin cho Hành khách {activePassengerIndex + 1}:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tên đệm & Tên *</label>
                    <input
                      type="text"
                      required
                      value={currentPassenger.first_name}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'first_name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="VAN A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Họ *</label>
                    <input
                      type="text"
                      required
                      value={currentPassenger.last_name}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'last_name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="NGUYEN"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ngày sinh *</label>
                    <input
                      type="date"
                      required
                      value={currentPassenger.date_of_birth}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'date_of_birth', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Giới tính</label>
                    <select
                      value={currentPassenger.gender}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'gender', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Phân loại khách</label>
                    <select
                      value={currentPassenger.passenger_type}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'passenger_type', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="adult">Người lớn (&ge; 12 tuổi)</option>
                      <option value="child">Trẻ em (2 - 11 tuổi)</option>
                      <option value="infant">Em bé (&lt; 2 tuổi)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Quốc tịch *</label>
                    <input
                      type="text"
                      required
                      value={currentPassenger.nationality}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'nationality', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Số hộ chiếu (Passport)</label>
                    <input
                      type="text"
                      value={currentPassenger.passport_number}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'passport_number', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Không bắt buộc"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Extras selections */}
            {currentPassenger && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-indigo-400" />
                  <span>3. Tiện ích hành lý & Suất ăn (Hành khách {activePassengerIndex + 1})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Baggage selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Thêm Hành lý ký gửi</label>
                    <select
                      value={currentPassenger.baggage_option_id}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'baggage_option_id', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Không có hành lý ký gửi kèm theo</option>
                      {baggageOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>+{opt.weight_kg}kg ({formatPrice(opt.price)})</option>
                      ))}
                    </select>
                  </div>

                  {/* Meal selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Đặt suất ăn nóng</label>
                    <select
                      value={currentPassenger.meal_option_id}
                      onChange={(e) => handlePassengerChange(activePassengerIndex, 'meal_option_id', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Không đặt suất ăn</option>
                      {mealOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name} ({formatPrice(opt.price)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seat selector map */}
                <div className="space-y-4 pt-4 border-t border-slate-850">
                  <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Chọn ghế ngồi</label>
                  <p className="text-xs text-slate-450">Ghế đã chọn: <span className="font-bold text-indigo-400">{dbSeats.find(s => s.id === currentPassenger.seat_id)?.seat_number || 'Chưa chọn'}</span></p>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-850 max-h-60 overflow-y-auto">
                    {dbSeats.map((seat) => {
                      const otherSelected = getSelectedSeatsByOthers(activePassengerIndex).includes(seat.id);
                      const isOccupied = seat.status !== 'available' || otherSelected;
                      const isSelected = currentPassenger.seat_id === seat.id;
                      
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isOccupied && !isSelected}
                          onClick={() => handlePassengerChange(activePassengerIndex, 'seat_id', isSelected ? '' : seat.id)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                            isSelected 
                              ? 'bg-indigo-650 text-white border-indigo-600' 
                              : isOccupied 
                                ? 'bg-slate-900 text-slate-655 border-slate-850 cursor-not-allowed line-through' 
                                : 'bg-slate-850 text-slate-300 border-slate-800 hover:border-indigo-500/50'
                          }`}
                        >
                          <div>{seat.seat_number}</div>
                          <div className="text-[9px] font-normal text-slate-500">{seat.seat_class[0].toUpperCase()}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Note details */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Ghi chú chuyến bay</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                placeholder="Yêu cầu dịch vụ đặc biệt hoặc ghi chú thêm cho hãng bay..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <span>Xác nhận & Tiến hành thanh toán</span>
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

          </form>

        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Flight Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3">Chi tiết chuyến bay</h3>
            <div className="flex items-center space-x-2 text-indigo-400">
              <Plane className="h-4 w-4 rotate-45" />
              <span className="font-bold text-sm">{flight.flight_number} &bull; {flight.airline?.name}</span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-white">{new Date(flight.departure_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-slate-400">{flight.origin_airport?.city} ({flight.origin_airport?.code})</p>
                </div>
                <div className="flex items-center text-slate-500">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{new Date(flight.arrival_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-slate-400">{flight.destination_airport?.city} ({flight.destination_airport?.code})</p>
                </div>
              </div>
              <p className="text-xs text-slate-450 border-t border-slate-850 pt-2">Khởi hành: {new Date(flight.departure_time).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3">Chi tiết giá</h3>
            
            <div className="space-y-2 text-sm text-slate-350">
              <div className="flex justify-between">
                <span>Vé cơ bản ({passengers.length} người)</span>
                <span>{formatPrice(Number(flight.base_price) * passengers.length)}</span>
              </div>
              
              {/* Baggage extras */}
              {passengers.some(p => p.baggage_option_id) && (
                <div className="flex justify-between">
                  <span>Hành lý thêm</span>
                  <span>
                    {formatPrice(
                      passengers.reduce((sum, p) => {
                        const bag = baggageOptions.find(b => b.id === p.baggage_option_id);
                        return sum + (bag ? Number(bag.price) * (p.baggage_quantity || 1) : 0);
                      }, 0)
                    )}
                  </span>
                </div>
              )}

              {/* Meals extras */}
              {passengers.some(p => p.meal_option_id) && (
                <div className="flex justify-between">
                  <span>Suất ăn đã đặt</span>
                  <span>
                    {formatPrice(
                      passengers.reduce((sum, p) => {
                        const meal = mealOptions.find(m => m.id === p.meal_option_id);
                        return sum + (meal ? Number(meal.price) * (p.meal_quantity || 1) : 0);
                      }, 0)
                    )}
                  </span>
                </div>
              )}

              {/* Seats extras */}
              {passengers.some(p => p.seat_id) && (
                <div className="flex justify-between">
                  <span>Phụ phí chọn ghế</span>
                  <span>
                    {formatPrice(
                      passengers.reduce((sum, p) => {
                        const seat = dbSeats.find(s => s.id === p.seat_id);
                        return sum + (seat ? Number(seat.price) : 0);
                      }, 0)
                    )}
                  </span>
                </div>
              )}

              {appliedDiscount && (
                <div className="flex justify-between text-rose-400">
                  <span>Giảm giá ({discountCode})</span>
                  <span>-{formatPrice(appliedDiscount.discount_amount)}</span>
                </div>
              )}
            </div>

            {/* Coupon Code Entry */}
            <div className="pt-4 border-t border-slate-850 space-y-2">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Mã giảm giá</label>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-2 text-sm text-white focus:outline-none placeholder-slate-655"
                    placeholder="MÃ GIẢM GIÁ"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleValidateDiscount}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-4 flex justify-between items-center">
              <span className="font-bold text-white text-lg">Tổng cộng</span>
              <span className="text-2xl font-black text-indigo-400">{formatPrice(calculateTotal())}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default BookingPage;
