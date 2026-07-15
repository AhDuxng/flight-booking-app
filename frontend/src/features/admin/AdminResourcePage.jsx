import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Input from "@/components/common/Input";
import Loading from "@/components/common/Loading";
import { formatCurrency, formatDateTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import AdminDataTable from "./AdminDataTable";
import AdminPageHeader from "./AdminPageHeader";
import { adminService } from "./adminService";

const resourceConfig = {
  flights: { title: "Chuyến bay", description: "Quản lý lịch bay, giá vé, tải ghế và trạng thái mở bán.", placeholder: "Tìm theo mã chuyến hoặc chặng bay", load: () => adminService.getFlights({ limit: 100 }), map: (item) => ({ id: item.id, flight: item.flight_number, route: `${item.origin_airport?.code ?? "-"} - ${item.destination_airport?.code ?? "-"}`, departure: formatDateTime(item.departure_time), seats: item.available_seats, status: item.status }), columns: [{ key: "flight", label: "Chuyến bay" }, { key: "route", label: "Chặng" }, { key: "departure", label: "Khởi hành" }, { key: "seats", label: "Ghế còn lại" }, { key: "status", label: "Trạng thái" }, { key: "actions", label: "", render: (row) => <Link className="text-label-md text-primary hover:underline" to={`/admin/flights/${row.id}/edit`}>Sửa</Link> }] },
  bookings: { title: "Đơn đặt vé", description: "Theo dõi đặt chỗ, trạng thái thanh toán và hành khách.", placeholder: "Tìm theo mã đặt chỗ hoặc chuyến bay", load: () => adminService.getBookings({ limit: 100 }), map: (item) => ({ id: item.id, customer: item.user?.full_name ?? item.contact_email, flight: item.flight?.flight_number ?? "-", departure: formatDateTime(item.flight?.departure_time), total: formatCurrency(item.total_price), status: item.status }), columns: [{ key: "id", label: "Mã đặt chỗ" }, { key: "customer", label: "Khách hàng" }, { key: "flight", label: "Chuyến bay" }, { key: "departure", label: "Khởi hành" }, { key: "total", label: "Tổng tiền" }, { key: "status", label: "Trạng thái" }] },
  payments: { title: "Thanh toán", description: "Kiểm tra giao dịch và trạng thái đối soát.", placeholder: "Tìm theo mã giao dịch hoặc booking", load: () => adminService.getPayments({ limit: 100 }), map: (item) => ({ id: item.id, reference: item.transaction_ref, booking: item.booking?.id ?? item.booking_id, provider: item.provider, amount: formatCurrency(item.amount), status: item.status }), columns: [{ key: "reference", label: "Mã giao dịch" }, { key: "booking", label: "Mã đặt chỗ" }, { key: "provider", label: "Phương thức" }, { key: "amount", label: "Số tiền" }, { key: "status", label: "Trạng thái" }] },
  reviews: { title: "Đánh giá", description: "Theo dõi phản hồi sau chuyến bay.", placeholder: "Tìm theo khách hàng hoặc chuyến bay", load: () => adminService.getReviews({ limit: 100 }), map: (item) => ({ id: item.id, customer: item.user?.full_name ?? "-", flight: item.flight?.flight_number ?? "-", rating: `${item.rating}/5`, visibility: item.is_visible ? "Hiển thị" : "Đã ẩn" }), columns: [{ key: "id", label: "Mã đánh giá" }, { key: "customer", label: "Khách hàng" }, { key: "flight", label: "Chuyến bay" }, { key: "rating", label: "Điểm" }, { key: "visibility", label: "Hiển thị" }] },
  users: { title: "Người dùng", description: "Quản lý hồ sơ tài khoản khách hàng.", placeholder: "Tìm theo tên, số điện thoại hoặc mã người dùng", load: () => adminService.getUsers({ limit: 100 }), map: (item) => ({ id: item.id, name: item.full_name ?? "-", phone: item.phone ?? "-", nationality: item.nationality ?? "-", created: formatDateTime(item.created_at) }), columns: [{ key: "id", label: "Mã người dùng" }, { key: "name", label: "Họ tên" }, { key: "phone", label: "Số điện thoại" }, { key: "nationality", label: "Quốc tịch" }, { key: "created", label: "Ngày tạo" }] },
  airports: { title: "Sân bay", description: "Quản lý sân bay và thành phố đang khai thác.", placeholder: "Tìm theo mã sân bay, thành phố hoặc tên", load: () => adminService.getAirports(), map: (item) => ({ id: item.id, code: item.code, name: item.name, city: item.city, country: item.country }), columns: [{ key: "code", label: "Mã sân bay" }, { key: "name", label: "Tên sân bay" }, { key: "city", label: "Thành phố" }, { key: "country", label: "Quốc gia" }] },
  airlines: { title: "Hãng bay", description: "Theo dõi hãng hàng không đang khai thác.", placeholder: "Tìm theo tên hãng hoặc mã", load: () => adminService.getAirlines(), map: (item) => ({ id: item.id, code: item.code, name: item.name, country: item.country, active: item.is_active ? "Đang hoạt động" : "Ngừng hoạt động" }), columns: [{ key: "code", label: "Mã hãng" }, { key: "name", label: "Tên hãng" }, { key: "country", label: "Quốc gia" }, { key: "active", label: "Trạng thái" }] },
  aircrafts: { title: "Tàu bay", description: "Quản lý đội tàu bay và số ghế khai thác.", placeholder: "Tìm theo mã hoặc dòng máy bay", load: () => adminService.getAircrafts(), map: (item) => ({ id: item.id, code: item.code, model: item.model, airline: item.airline?.name ?? "-", seats: item.total_seats }), columns: [{ key: "code", label: "Mã tàu bay" }, { key: "model", label: "Dòng máy bay" }, { key: "airline", label: "Hãng bay" }, { key: "seats", label: "Số ghế" }] },
};

export default function AdminResourcePage({ resource }) {
  const config = resourceConfig[resource];
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRows = async () => {
    setIsLoading(true);
    try {
      const response = await config.load();
      setRows((response.data ?? []).map(config.map));
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải dữ liệu quản trị."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [resource]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return query ? rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query)) : rows;
  }, [rows, searchTerm]);

  return <div className="flex min-w-0 flex-col gap-stack-md"><AdminPageHeader description={config.description} title={config.title} /><Input icon={Search} label="Tìm kiếm" onChange={(event) => setSearchTerm(event.target.value)} placeholder={config.placeholder} type="search" value={searchTerm} />{isLoading ? <Loading className="min-h-48" label="Đang tải dữ liệu" /> : error ? <ErrorMessage message={error} onRetry={loadRows} /> : filteredRows.length > 0 ? <AdminDataTable columns={config.columns} rows={filteredRows} /> : <EmptyState description="Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại dữ liệu." title="Không có dữ liệu phù hợp" />}</div>;
}
