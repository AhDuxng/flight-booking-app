import FlightListFeature from "@/features/flights/FlightListFeature";

export default function FlightListPage() {
  return (
    <div className="flex flex-col bg-surface-container">
      {/* Search Header Area */}
      <div className="bg-primary pt-8 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-container-padding text-center mt-8">
          <h1 className="font-display-md text-display-md text-on-primary font-black tracking-tight mb-stack-sm">
            Kết quả tìm kiếm
          </h1>
          <p className="font-body-lg text-body-lg text-secondary-fixed">
            Hàng ngàn chuyến bay đang chờ đón bạn
          </p>
        </div>
      </div>
      
      <FlightListFeature />
    </div>
  );
}
