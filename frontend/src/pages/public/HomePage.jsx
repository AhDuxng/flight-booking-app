import FlightSearchFeature from "@/features/flights/FlightSearchFeature";
import PopularRoutes from "@/features/flights/PopularRoutes";
import TrustSignals from "@/features/common/TrustSignals";

export default function HomePage() {
  return (
    <>
      <FlightSearchFeature />
      <PopularRoutes />
      <TrustSignals />
    </>
  );
}
