import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Plane } from "lucide-react";
import Button from "@/components/common/Button";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { formatCurrency, formatDateTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import AdminDataTable from "./AdminDataTable";
import AdminPageHeader from "./AdminPageHeader";
import AdminStatCard from "./AdminStatCard";
import { adminService } from "./adminService";

const bookingColumns = [{ key: "id", label: "Mã đặt chỗ" }, { key: "customer", label: "Khách hàng" }, { key: "flight", label: "Chuyến bay" }, { key: "total", label: "Tổng tiền" }, { key: "status", label: "Trạng thái" }];
const flightColumns = [{ key: "id", label: "Mã chuyến" }, { key: "route", label: "Chặng" }, { key: "departure", label: "Khởi hành" }, { key: "seats", label: "Ghế còn" }, { key: "status", label: "Trạng thái" }];

export default function AdminDashboardFeature() {
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [dashboardResponse, bookingsResponse, flightsResponse] = await Promise.all([adminService.getDashboard(), adminService.getBookings({ limit: 3 }), adminService.getFlights({ limit: 3 })]);
      setDashboard(dashboardResponse.data);
      setBookings((bookingsResponse.data ?? []).map((item) => ({ id: item.id, customer: item.user?.full_name ?? item.contact_email, flight: item.flight?.flight_number ?? "-", total: formatCurrency(item.total_price), status: item.status })));
      setFlights((flightsResponse.data ?? []).map((item) => ({ id: item.flight_number, route: `${item.origin_airport?.code ?? "-"} - ${item.destination_airport?.code ?? "-"}`, departure: formatDateTime(item.departure_time), seats: item.available_seats, status: item.status })));
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải bảng điều khiển."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (isLoading) {
    return <Loading label="Đang tải bảng điều khiển" />;
  }

  if (error || !dashboard) {
    return <ErrorMessage message={error} onRetry={loadDashboard} />;
  }

  const stats = [{ label: "Doanh thu xác nhận", value: formatCurrency(dashboard.revenue), trend: "Dữ liệu thực" }, { label: "Tổng đơn đặt vé", value: dashboard.bookings, trend: "Dữ liệu thực" }, { label: "Chuyến bay hoạt động", value: dashboard.scheduledFlights, trend: `${dashboard.flights} tổng chuyến` }, { label: "Đơn chờ thanh toán", value: dashboard.pendingBookings, trend: `${dashboard.confirmedBookings} đã xác nhận` }];

  return <div className="flex min-w-0 flex-col gap-stack-md"><AdminPageHeader action={<Button as={Link} icon={Plane} to="/admin/flights/create" variant="admin">Tạo chuyến bay</Button>} description="Tổng quan vận hành bán vé, lịch bay và các giao dịch cần theo dõi." title="Bảng điều khiển" /><div className="grid grid-cols-1 gap-gutter-md sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <AdminStatCard key={stat.label} {...stat} />)}</div><div className="grid grid-cols-1 gap-stack-md xl:grid-cols-2"><DashboardSection icon={CalendarCheck} rows={bookings} columns={bookingColumns} title="Đặt chỗ gần đây" to="/admin/bookings" /><DashboardSection icon={Plane} rows={flights} columns={flightColumns} title="Chuyến bay gần đây" to="/admin/flights" /></div></div>;
}

function DashboardSection({ icon: Icon, title, to, rows, columns }) {
  return <section className="flex min-w-0 flex-col gap-stack-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-primary"><Icon className="h-5 w-5" /><h2 className="text-title-lg">{title}</h2></div><Link className="rounded-lg bg-emerald-600 px-3 py-1.5 text-label-md text-white shadow-sm transition-colors hover:bg-emerald-700" to={to}>Xem tất cả</Link></div>{rows.length ? <AdminDataTable columns={columns} rows={rows} /> : <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-md text-body-sm text-on-surface-variant">Chưa có dữ liệu.</div>}</section>;
}
