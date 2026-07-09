import { ArrowRight } from "lucide-react";
import RouteCard from "./RouteCard";
import danangImage from "@/assets/images/home/danang.jpg";
import nhatrangImage from "@/assets/images/home/nhatrang.jpg";
import phuquocImage from "@/assets/images/home/phuquoc.jpg";

const POPULAR_ROUTES = [
  {
    id: "route-1",
    origin: "TP. HCM",
    destination: "Đà Nẵng",
    price: "890.000",
    image: danangImage,
  },
  {
    id: "route-2",
    origin: "Hà Nội",
    destination: "Phú Quốc",
    price: "1.250.000",
    image: phuquocImage,
  },
  {
    id: "route-3",
    origin: "TP. HCM",
    destination: "Nha Trang",
    price: "750.000",
    image: nhatrangImage,
  },
];

export default function PopularRoutes() {
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
        <button className="hidden md:flex text-primary font-label-md text-label-md items-center gap-1 cursor-pointer">
          Xem tất cả <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
        {POPULAR_ROUTES.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </section>
  );
}
