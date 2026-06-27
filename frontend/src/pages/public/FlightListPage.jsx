import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlights } from '../../store/flightStore.jsx';
import { Plane, Filter, Clock, ArrowRight, ArrowUpDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const FlightListPage = () => {
  const { flights, searchParams, loading } = useFlights();
  const navigate = useNavigate();
  
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [priceRange, setPriceRange] = useState(10000000); // 10 million max
  const [sortBy, setSortBy] = useState('price-asc'); // price-asc, price-desc, time-asc

  // Unique airlines list for filtering
  const airlines = Array.from(new Set(flights.map(f => f.airline?.name).filter(Boolean)));

  useEffect(() => {
    // Initial load
    setFilteredFlights(flights);
    
    // Auto-calculate maximum price of results
    if (flights.length > 0) {
      const prices = flights.map(f => Number(f.base_price));
      const maxPrice = Math.max(...prices);
      setPriceRange(maxPrice + 500000); // add padding
    }
  }, [flights]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...flights];

    // Filter by airline
    if (selectedAirlines.length > 0) {
      result = result.filter(f => selectedAirlines.includes(f.airline?.name));
    }

    // Filter by price
    result = result.filter(f => Number(f.base_price) <= priceRange);

    // Apply sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.base_price) - Number(b.base_price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.base_price) - Number(a.base_price));
    } else if (sortBy === 'time-asc') {
      result.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
    }

    setFilteredFlights(result);
  }, [selectedAirlines, priceRange, sortBy, flights]);

  const handleAirlineToggle = (airline) => {
    setSelectedAirlines(prev => 
      prev.includes(airline) ? prev.filter(a => a !== airline) : [...prev, airline]
    );
  };

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

  const handleSelectFlight = (flightId) => {
    navigate(`/flights/${flightId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-200">
      
      {/* Flight Search Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-950 rounded-xl border border-indigo-900 text-indigo-400">
            <Plane className="h-6 w-6 rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <span>{searchParams.origin || 'HAN'}</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span>{searchParams.destination || 'SGN'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ngày bay: {searchParams.departure_date} &bull; Số lượng: {searchParams.passengers} hành khách &bull; Hạng ghế: {searchParams.seat_class}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 border border-slate-700 hover:border-white text-slate-350 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
        >
          Thay đổi tìm kiếm
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-6">
              <span className="font-semibold text-white flex items-center space-x-2">
                <Filter className="h-4 w-4 text-indigo-400" />
                <span>Bộ lọc tìm kiếm</span>
              </span>
              <button 
                onClick={() => { setSelectedAirlines([]); setSortBy('price-asc'); }}
                className="text-xs text-slate-500 hover:text-indigo-450 cursor-pointer"
              >
                Đặt lại
              </button>
            </div>

            {/* Sort Order */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Sắp xếp theo</label>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="time-asc">Giờ khởi hành: Sớm nhất</option>
                </select>
              </div>
            </div>

            {/* Airlines filter */}
            {airlines.length > 0 && (
              <div className="space-y-3 mb-6">
                <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider block">Hãng hàng không</label>
                <div className="space-y-2">
                  {airlines.map((airline) => (
                    <label key={airline} className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(airline)}
                        onChange={() => handleAirlineToggle(airline)}
                        className="rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      <span>{airline}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Giá vé tối đa</label>
              <input
                type="range"
                min="0"
                max="10000000"
                step="200000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0đ</span>
                <span className="text-indigo-400 font-semibold">{formatPrice(priceRange)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-sm text-slate-400">Đang tìm kiếm chuyến bay thích hợp...</p>
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
              <Plane className="h-12 w-12 text-slate-600 mx-auto rotate-45 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy chuyến bay nào</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Hãy thử chọn ngày khởi hành khác hoặc thay đổi lộ trình tìm kiếm của bạn.
              </p>
            </div>
          ) : (
            filteredFlights.map((flight) => (
              <div
                key={flight.id}
                className="bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-indigo-500/3 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0"
              >
                
                {/* Flight detail timeline */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 items-center w-full">
                  
                  {/* Airline name and logo */}
                  <div className="flex items-center space-x-3 col-span-1">
                    <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center p-1.5 overflow-hidden">
                      {flight.airline?.logo_url ? (
                        <img src={flight.airline.logo_url} alt={flight.airline.name} className="object-contain max-h-full max-w-full" />
                      ) : (
                        <Plane className="h-5 w-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{flight.airline?.name}</p>
                      <p className="text-xs text-slate-500">{flight.flight_number} &bull; {flight.aircraft?.model}</p>
                    </div>
                  </div>

                  {/* Departure time & airport */}
                  <div className="text-left md:text-center">
                    <p className="font-bold text-white text-lg">
                      {new Date(flight.departure_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs font-semibold text-slate-450 mt-0.5">{flight.origin_airport?.code} - {flight.origin_airport?.city}</p>
                  </div>

                  {/* Duration timeline graphic */}
                  <div className="flex flex-col items-center justify-center px-4 col-span-1">
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{getDuration(flight.departure_time, flight.arrival_time)}</span>
                    </span>
                    <div className="w-full flex items-center space-x-1 my-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <div className="h-px flex-grow bg-slate-800 border-dashed border-t border-slate-700" />
                      <Plane className="h-4.5 w-4.5 text-indigo-500 rotate-90" />
                      <div className="h-px flex-grow bg-slate-800 border-dashed border-t border-slate-700" />
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Bay thẳng</span>
                  </div>

                  {/* Arrival time & airport */}
                  <div className="text-left md:text-center">
                    <p className="font-bold text-white text-lg">
                      {new Date(flight.arrival_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs font-semibold text-slate-450 mt-0.5">{flight.destination_airport?.code} - {flight.destination_airport?.city}</p>
                  </div>

                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block h-12 w-px bg-slate-800 mx-8" />

                {/* Price and Action Button */}
                <div className="text-right w-full md:w-auto shrink-0 space-y-3">
                  <div>
                    <span className="text-slate-400 text-xs block">Giá vé từ</span>
                    <span className="text-2xl font-extrabold text-white">{formatPrice(flight.base_price)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Mỗi hành khách</span>
                  </div>
                  <button
                    onClick={() => handleSelectFlight(flight.id)}
                    className="w-full md:w-auto flex items-center justify-center space-x-1 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer group"
                  >
                    <span>Chọn chuyến bay</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <span className="text-[10px] text-slate-400 block text-center md:text-right">Còn {flight.available_seats} ghế trống</span>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};

export default FlightListPage;
