import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import RouteCard from "./RouteCard";
import danangImage from "@/assets/images/home/danang.jpg";
import nhatrangImage from "@/assets/images/home/nhatrang.jpg";
import phuquocImage from "@/assets/images/home/phuquoc.jpg";
import airportService from "@/features/airports/airportService";

const POPULAR_ROUTES = [
  {
    id: "route-1",
    origin: "TP. HCM",
    originCode: "SGN",
    destination: "Đà Nẵng",
    destinationCode: "DAD",
    image: danangImage,
  },
  {
    id: "route-2",
    origin: "Hà Nội",
    originCode: "HAN",
    destination: "Phú Quốc",
    destinationCode: "PQC",
    image: phuquocImage,
  },
  {
    id: "route-3",
    origin: "TP. HCM",
    originCode: "SGN",
    destination: "Nha Trang",
    destinationCode: "CXR",
    image: nhatrangImage,
  },
];

export default function PopularRoutes() {
  const navigate = useNavigate();
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    airportService.getAll().then((response) => setAirports(response.data ?? [])).catch(() => setAirports([]));
  }, []);

  const openRoute = (route) => {
    const origin = airports.find((airport) => airport.code === route.originCode);
    const destination = airports.find((airport) => airport.code === route.destinationCode);
    const params = new URLSearchParams();
    if (origin?.id) {
      params.set("originAirportId", origin.id);
      params.set("departureTimezone", origin.timezone || "Asia/Ho_Chi_Minh");
    }
    if (destination?.id) {
      params.set("destinationAirportId", destination.id);
    }
    navigate(`/flights${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="py-section-gap px-container-padding max-w-7xl mx-auto mt-16 md:mt-24">
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary mb-2">
            Điểm đến phổ biến
          </h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Khám phá những điểm đến hấp dẫn nhất cùng VietFly
          </p>
        </div>
        <button className="hidden items-center gap-1 text-label-md font-label-md text-primary md:flex" onClick={() => navigate("/flights")} type="button">
          Xem tất cả <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
        {POPULAR_ROUTES.map((route) => (
          <RouteCard key={route.id} onSelect={() => openRoute(route)} route={route} />
        ))}
      </div>
    </section>
  );
}
