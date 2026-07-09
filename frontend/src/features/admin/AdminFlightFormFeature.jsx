import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import FlightForm from "./FlightForm";
import AdminPageHeader from "./AdminPageHeader";
import { adminFlights } from "./adminMockData";

const defaultFlight = {
  aircraft: "Airbus A321neo",
  airline: "VietFly Airlines",
  arrival: "10:45",
  date: "2026-08-12",
  departure: "08:30",
  destination: "SGN",
  id: "",
  origin: "HAN",
  price: "1850000",
  seats: "210",
  status: "scheduled",
};

export default function AdminFlightFormFeature({ mode = "create" }) {
  const { flightId } = useParams();
  const navigate = useNavigate();

  const initialValues = useMemo(() => {
    if (mode === "create") {
      return defaultFlight;
    }

    return adminFlights.find((flight) => flight.id === flightId) ?? defaultFlight;
  }, [flightId, mode]);

  const handleSubmit = () => {
    toast.success(mode === "create" ? "Đã tạo chuyến bay mẫu" : "Đã cập nhật chuyến bay mẫu");
    navigate("/admin/flights");
  };

  return (
    <div className="flex min-w-0 flex-col gap-stack-md">
      <AdminPageHeader
        description="Nhập thông tin lịch bay, tàu bay, chặng và trạng thái mở bán."
        title={mode === "create" ? "Tạo chuyến bay" : `Cập nhật chuyến bay ${flightId}`}
      />
      <FlightForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={mode === "create" ? "Tạo chuyến bay" : "Lưu thay đổi"} />
    </div>
  );
}
