import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Button from "@/components/common/Button";
import ErrorMessage from "@/components/common/ErrorMessage";
import Input from "@/components/common/Input";
import Loading from "@/components/common/Loading";
import Select from "@/components/common/Select";
import { flightService } from "@/features/flights/flightService";
import { getErrorMessage } from "@/lib/apiError";
import AdminPageHeader from "./AdminPageHeader";
import { adminService } from "./adminService";

const initialValues = {
  airlineId: "",
  aircraftId: "",
  originAirportId: "",
  destinationAirportId: "",
  flightNumber: "",
  departureDate: "",
  departureTime: "",
  arrivalDate: "",
  arrivalTime: "",
  basePrice: "",
  seatCount: "",
  status: "scheduled",
};
const statusOptions = [
  { label: "Đã lên lịch", value: "scheduled" },
  { label: "Đang lên máy bay", value: "boarding" },
  { label: "Đã khởi hành", value: "departed" },
  { label: "Đã đến", value: "arrived" },
  { label: "Bị hoãn", value: "delayed" },
  { label: "Đã hủy", value: "cancelled" },
];

export default function AdminFlightFormFeature({ mode = "create" }) {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [options, setOptions] = useState({ airlines: [], aircrafts: [], airports: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      try {
        const requests = [
          adminService.getAirlines(),
          adminService.getAircrafts(),
          adminService.getAirports(),
        ];
        if (mode === "edit") {
          requests.push(flightService.getById(flightId));
        }
        const [airlinesResponse, aircraftsResponse, airportsResponse, flightResponse] =
          await Promise.all(requests);
        const airlines = airlinesResponse.data ?? [];
        const aircrafts = aircraftsResponse.data ?? [];
        const airports = airportsResponse.data ?? [];
        setOptions({ airlines, aircrafts, airports });

        if (flightResponse?.data) {
          setValues(toFormValues(flightResponse.data));
        } else {
          const airlineId = airlines[0]?.id ?? "";
          setValues((current) => ({
            ...current,
            airlineId,
            aircraftId: aircrafts.find((aircraft) => aircraft.airline_id === airlineId)?.id ?? "",
            originAirportId: airports[0]?.id ?? "",
            destinationAirportId: airports[1]?.id ?? airports[0]?.id ?? "",
          }));
        }
        setError("");
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải dữ liệu form chuyến bay."));
      } finally {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [flightId, mode]);

  const setField = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const departure = new Date(`${values.departureDate}T${values.departureTime}:00`);
    const arrival = new Date(`${values.arrivalDate}T${values.arrivalTime}:00`);
    if (values.originAirportId === values.destinationAirportId) {
      toast.error("Điểm đi và điểm đến phải khác nhau.");
      return;
    }
    if (arrival <= departure) {
      toast.error("Thời gian đến phải sau thời gian khởi hành.");
      return;
    }
    if (["scheduled", "delayed"].includes(values.status) && departure <= new Date()) {
      toast.error("Chuyến bay đang mở bán phải khởi hành trong tương lai.");
      return;
    }
    const selectedAircraft = options.aircrafts.find((item) => item.id === values.aircraftId);
    if (
      mode === "create" &&
      Number(values.seatCount) > Number(selectedAircraft?.total_seats ?? 0)
    ) {
      toast.error(
        `Số ghế không được vượt quá sức chứa ${selectedAircraft?.total_seats ?? 0} ghế của tàu bay.`,
      );
      return;
    }
    const payload = {
      airlineId: values.airlineId,
      aircraftId: values.aircraftId,
      originAirportId: values.originAirportId,
      destinationAirportId: values.destinationAirportId,
      flightNumber: values.flightNumber,
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      basePrice: Number(values.basePrice),
      status: values.status,
    };

    if (mode === "create") {
      payload.seats = createSeats(Number(values.seatCount), Number(values.basePrice));
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await adminService.createFlight(payload);
      } else {
        await adminService.updateFlight(flightId, payload);
      }
      toast.success(mode === "create" ? "Đã tạo chuyến bay." : "Đã cập nhật chuyến bay.");
      navigate("/admin/flights");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể lưu chuyến bay."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading label="Đang tải form chuyến bay" />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const airlineOptions = options.airlines.map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.name}`,
  }));
  const matchingAircrafts = options.aircrafts.filter(
    (item) => item.airline_id === values.airlineId,
  );
  const selectedAircraft = matchingAircrafts.find((item) => item.id === values.aircraftId);
  const aircraftOptions = matchingAircrafts.map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.model}`,
  }));
  const airportOptions = options.airports.map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.city}`,
  }));

  const handleAirlineChange = (airlineId) => {
    const firstAircraft = options.aircrafts.find((item) => item.airline_id === airlineId);
    setValues((current) => ({ ...current, airlineId, aircraftId: firstAircraft?.id ?? "" }));
  };

  return (
    <div className="flex min-w-0 flex-col gap-stack-md">
      <AdminPageHeader
        description="Nhập thông tin lịch bay, tàu bay, chặng và trạng thái mở bán."
        title={mode === "create" ? "Tạo chuyến bay" : `Cập nhật chuyến bay ${values.flightNumber}`}
      />
      <form
        className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
          <Input
            label="Mã chuyến bay"
            name="flightNumber"
            onChange={(event) => setField("flightNumber", event.target.value.toUpperCase())}
            required
            value={values.flightNumber}
          />
          <FieldSelect
            label="Hãng bay"
            onChange={handleAirlineChange}
            options={airlineOptions}
            value={values.airlineId}
          />
          <FieldSelect
            label="Tàu bay"
            onChange={(value) => setField("aircraftId", value)}
            options={aircraftOptions}
            value={values.aircraftId}
          />
          <FieldSelect
            label="Trạng thái"
            onChange={(value) => setField("status", value)}
            options={statusOptions}
            value={values.status}
          />
          <FieldSelect
            label="Điểm đi"
            onChange={(value) => setField("originAirportId", value)}
            options={airportOptions}
            value={values.originAirportId}
          />
          <FieldSelect
            label="Điểm đến"
            onChange={(value) => setField("destinationAirportId", value)}
            options={airportOptions}
            value={values.destinationAirportId}
          />
          <Input
            label="Ngày đi"
            name="departureDate"
            onChange={(event) => setField("departureDate", event.target.value)}
            required
            type="date"
            value={values.departureDate}
          />
          <Input
            label="Giờ đi"
            name="departureTime"
            onChange={(event) => setField("departureTime", event.target.value)}
            required
            type="time"
            value={values.departureTime}
          />
          <Input
            label="Ngày đến"
            name="arrivalDate"
            onChange={(event) => setField("arrivalDate", event.target.value)}
            required
            type="date"
            value={values.arrivalDate}
          />
          <Input
            label="Giờ đến"
            name="arrivalTime"
            onChange={(event) => setField("arrivalTime", event.target.value)}
            required
            type="time"
            value={values.arrivalTime}
          />
          <Input
            label="Giá vé cơ bản"
            min="0"
            name="basePrice"
            onChange={(event) => setField("basePrice", event.target.value)}
            required
            type="number"
            value={values.basePrice}
          />
          {mode === "create" ? (
            <Input
              label={`Số ghế mở bán (tối đa ${selectedAircraft?.total_seats ?? 0})`}
              max={selectedAircraft?.total_seats ?? 1}
              min="1"
              name="seatCount"
              onChange={(event) => setField("seatCount", event.target.value)}
              required
              type="number"
              value={values.seatCount}
            />
          ) : null}
        </div>
        <div className="mt-stack-md flex justify-end">
          <Button disabled={isSubmitting} type="submit" variant="admin">
            {isSubmitting ? "Đang lưu..." : mode === "create" ? "Tạo chuyến bay" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FieldSelect({ label, options, value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-label-md text-on-surface">{label}</span>
      <Select
        className="h-11 sm:min-w-0"
        label={label}
        onChange={onChange}
        options={options}
        value={value}
      />
    </label>
  );
}

function toFormValues(flight) {
  const departure = new Date(flight.departure_time);
  const arrival = new Date(flight.arrival_time);
  const departureParts = toLocalParts(departure);
  const arrivalParts = toLocalParts(arrival);
  return {
    airlineId: flight.airline_id,
    aircraftId: flight.aircraft_id,
    originAirportId: flight.origin_airport_id,
    destinationAirportId: flight.destination_airport_id,
    flightNumber: flight.flight_number,
    departureDate: departureParts.date,
    departureTime: departureParts.time,
    arrivalDate: arrivalParts.date,
    arrivalTime: arrivalParts.time,
    basePrice: String(flight.base_price ?? ""),
    seatCount: "",
    status: flight.status,
  };
}

function toLocalParts(value) {
  const pad = (number) => String(number).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

function createSeats(count, price) {
  const columns = ["A", "B", "C", "D", "E", "F"];
  return Array.from({ length: count }, (_, index) => ({
    seatNumber: `${Math.floor(index / columns.length) + 1}${columns[index % columns.length]}`,
    seatClass: "economy",
    price,
  }));
}
