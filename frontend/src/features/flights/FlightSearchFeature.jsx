import FlightSearchForm from "./FlightSearchForm";

export default function FlightSearchFeature() {
  return (
    <section className="relative w-full bg-deep-navy pt-8 pb-32 md:pt-16 md:pb-48">
      <div className="absolute inset-0 overflow-hidden">
        <div className="bg-[url('/src/assets/images/home/hero-bg.jpg')] bg-cover bg-center bg-no-repeat w-full h-full opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-container-padding">
        <div className="text-center mb-12">
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-on-primary mb-4">
            Bay cao cùng VietFly
          </h1>
          <p className="text-title-lg font-title-lg text-on-primary/90 max-w-2xl mx-auto">
            Trải nghiệm dịch vụ hàng không đẳng cấp với mạng lưới đường bay rộng khắp.
          </p>
        </div>
        <FlightSearchForm />
      </div>
    </section>
  );
}
