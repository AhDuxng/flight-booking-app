export default function RouteCard({ route }) {
  return (
    <div className="group bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
      <div className="h-48 relative overflow-hidden">
        <img
          alt={route.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={route.image}
        />
        <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full text-label-md font-label-md text-primary font-bold shadow-sm">
          {route.destination}
        </div>
      </div>
      <div className="p-stack-md">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-body-sm font-body-sm">Từ {route.origin}</span>
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-label-md font-label-md text-on-surface-variant mb-1">
              Giá chỉ từ
            </p>
            <p className="text-title-lg font-title-lg text-primary font-bold">
              {route.price} <span className="text-body-sm font-body-sm font-normal">VND</span>
            </p>
          </div>
          <button className="text-secondary-container bg-primary-container p-2 rounded-full hover:bg-primary transition-colors">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
