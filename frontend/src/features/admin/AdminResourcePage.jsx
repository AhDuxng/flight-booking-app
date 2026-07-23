import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Input from "@/components/common/Input";
import Loading from "@/components/common/Loading";
import Modal from "@/components/common/Modal";
import { formatCurrency, formatDateTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import AdminDataTable from "./AdminDataTable";
import AdminPageHeader from "./AdminPageHeader";
import { adminService } from "./adminService";

const resourceConfig = {
  flights: { title: "Chuyến bay", description: "Quản lý lịch bay, giá vé, tải ghế và trạng thái mở bán.", placeholder: "Tìm theo mã chuyến hoặc chặng bay", load: () => adminService.getFlights({ limit: 100 }), map: (item) => ({ id: item.id, flight: item.flight_number, route: `${item.origin_airport?.code ?? "-"} - ${item.destination_airport?.code ?? "-"}`, departure: formatDateTime(item.departure_time), seats: item.available_seats, status: item.status }), columns: [{ key: "flight", label: "Chuyến bay" }, { key: "route", label: "Chặng" }, { key: "departure", label: "Khởi hành" }, { key: "seats", label: "Ghế còn lại" }, { key: "status", label: "Trạng thái" }, { key: "actions", label: "", render: (row) => <Link className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-label-md text-white shadow-sm transition-colors hover:bg-emerald-700" to={`/admin/flights/${row.id}/edit`}>Sửa</Link> }] },
  bookings: { title: "Đơn đặt vé", description: "Theo dõi đặt chỗ, trạng thái thanh toán và hành khách.", placeholder: "Tìm theo mã đặt chỗ hoặc chuyến bay", load: () => adminService.getBookings({ limit: 100 }), map: (item) => ({ id: item.id, customer: item.user?.full_name ?? item.contact_email, flight: item.flight?.flight_number ?? "-", flightStatus: item.flight?.status, departure: formatDateTime(item.flight?.departure_time), departureTime: item.flight?.departure_time, total: formatCurrency(item.total_price), status: item.status }), columns: [{ key: "id", label: "Mã đặt chỗ" }, { key: "customer", label: "Khách hàng" }, { key: "flight", label: "Chuyến bay" }, { key: "departure", label: "Khởi hành" }, { key: "total", label: "Tổng tiền" }, { key: "status", label: "Trạng thái" }] },
  payments: { title: "Thanh toán", description: "Kiểm tra giao dịch và trạng thái đối soát.", placeholder: "Tìm theo mã giao dịch hoặc booking", load: () => adminService.getPayments({ limit: 100 }), map: (item) => ({ id: item.id, reference: item.transaction_ref, booking: item.booking?.id ?? item.booking_id, provider: item.provider, amount: formatCurrency(item.amount), status: item.status }), columns: [{ key: "reference", label: "Mã giao dịch" }, { key: "booking", label: "Mã đặt chỗ" }, { key: "provider", label: "Phương thức" }, { key: "amount", label: "Số tiền" }, { key: "status", label: "Trạng thái" }] },
  reviews: { title: "Đánh giá", description: "Theo dõi phản hồi sau chuyến bay.", placeholder: "Tìm theo khách hàng hoặc chuyến bay", load: () => adminService.getReviews({ limit: 100 }), map: (item) => ({ id: item.id, customer: item.user?.full_name ?? "-", flight: item.flight?.flight_number ?? "-", rating: `${item.rating}/5`, visibility: item.is_visible ? "Hiển thị" : "Đã ẩn", isVisible: item.is_visible }), columns: [{ key: "id", label: "Mã đánh giá" }, { key: "customer", label: "Khách hàng" }, { key: "flight", label: "Chuyến bay" }, { key: "rating", label: "Điểm" }, { key: "visibility", label: "Hiển thị" }] },
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
  const [editingItem, setEditingItem] = useState(undefined);

  const loadRows = async () => {
    setIsLoading(true);
    try {
      const response = await config.load();
      setRows((response.data ?? []).map((item) => ({ ...config.map(item), _raw: item })));
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

  const masterResource = ["airports", "airlines", "aircrafts"].includes(resource);
  const handleToggleReview = async (row) => {
    try {
      await adminService.moderateReview(row.id, !row.isVisible);
      toast.success(row.isVisible ? "Đã ẩn đánh giá." : "Đã hiển thị đánh giá.");
      await loadRows();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể cập nhật đánh giá."));
    }
  };
  const handleCashPayment = async (row, status) => {
    const label = status === "success" ? "xác nhận đã thu tiền" : "từ chối giao dịch";
    if (!window.confirm(`Bạn có chắc muốn ${label} cho giao dịch ${row.reference}?`)) {
      return;
    }
    try {
      await adminService.processCashPayment(row.id, status);
      toast.success(status === "success" ? "Đã xác nhận thanh toán tiền mặt." : "Đã từ chối thanh toán tiền mặt.");
      await loadRows();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể xử lý thanh toán."));
    }
  };
  const handleRefund = async (row) => {
    if (!window.confirm(`Xác nhận đã hoàn tiền cho giao dịch ${row.reference}? Thao tác này không thể đảo ngược.`)) {
      return;
    }
    try {
      await adminService.refundPayment(row.id);
      toast.success("Đã ghi nhận hoàn tiền thành công.");
      await loadRows();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể hoàn tiền giao dịch."));
    }
  };
  const handleCancelBooking = async (row) => {
    if (!window.confirm(`Hủy booking ${row.id}? Nếu đã thanh toán, booking sẽ chuyển sang chờ hoàn tiền.`)) {
      return;
    }
    try {
      await adminService.cancelBooking(row.id);
      toast.success("Đã xử lý hủy booking.");
      await loadRows();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không thể hủy booking."));
    }
  };
  const columns = useMemo(() => {
    if (resource === "users") {
      return [...config.columns, { key: "actions", label: "", render: (row) => <Link className={adminActionClass} to={`/admin/users/${row.id}`}>Chi tiết</Link> }];
    }
    if (!masterResource) {
      if (resource === "bookings") {
        return [...config.columns, { key: "actions", label: "", render: (row) => ["pending", "paid", "confirmed"].includes(row.status) && new Date(row.departureTime).getTime() > Date.now() && ["scheduled", "delayed"].includes(row.flightStatus) ? <button className={adminActionClass} onClick={() => handleCancelBooking(row)} type="button">Hủy</button> : "" }];
      }
      if (resource === "reviews") {
        return [...config.columns, { key: "actions", label: "", render: (row) => <button className={adminActionClass} onClick={() => handleToggleReview(row)} type="button">{row.isVisible ? "Ẩn" : "Hiện"}</button> }];
      }
      if (resource === "payments") {
        return [...config.columns, { key: "actions", label: "", render: (row) => row.status === "refund_pending" ? <button className={adminActionClass} onClick={() => handleRefund(row)} type="button">Hoàn tiền</button> : row.provider === "cash" && row.status === "pending" ? <div className="flex gap-2"><button className={adminActionClass} onClick={() => handleCashPayment(row, "success")} type="button">Xác nhận</button><button className={adminActionClass} onClick={() => handleCashPayment(row, "failed")} type="button">Từ chối</button></div> : "" }];
      }
      return config.columns;
    }
    return [...config.columns, { key: "actions", label: "", render: (row) => <button className={adminActionClass} onClick={() => setEditingItem(row._raw)} type="button"><Pencil className="h-4 w-4" />Sửa</button> }];
  }, [config.columns, masterResource, resource, rows]);

  const headerAction = resource === "flights"
    ? <Button as={Link} icon={Plus} to="/admin/flights/create" variant="admin">Tạo chuyến bay</Button>
    : masterResource
      ? <Button icon={Plus} onClick={() => setEditingItem(null)} variant="admin">Thêm mới</Button>
      : null;

  return <div className="flex min-w-0 flex-col gap-stack-md"><AdminPageHeader action={headerAction} description={config.description} title={config.title} /><Input icon={Search} label="Tìm kiếm" onChange={(event) => setSearchTerm(event.target.value)} placeholder={config.placeholder} type="search" value={searchTerm} />{isLoading ? <Loading className="min-h-48" label="Đang tải dữ liệu" /> : error ? <ErrorMessage message={error} onRetry={loadRows} /> : filteredRows.length > 0 ? <AdminDataTable columns={columns} rows={filteredRows} /> : <EmptyState description="Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại dữ liệu." title="Không có dữ liệu phù hợp" />}{masterResource ? <MasterDataModal item={editingItem} onClose={() => setEditingItem(undefined)} onSaved={async () => { setEditingItem(undefined); await loadRows(); }} resource={resource} /> : null}</div>;
}

const fieldClass = "h-11 w-full rounded-lg border border-outline-variant bg-surface px-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const adminActionClass = "inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-label-md text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50";

function MasterDataModal({ item, onClose, onSaved, resource }) {
  const [values, setValues] = useState(() => toMasterValues(resource, item));
  const [airlines, setAirlines] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const isOpen = item !== undefined;

  useEffect(() => {
    setValues(toMasterValues(resource, item));
    if (isOpen && resource === "aircrafts") {
      adminService.getAirlines().then((response) => {
        const items = response.data ?? [];
        setAirlines(items);
        setValues((current) => ({ ...current, airlineId: current.airlineId || items[0]?.id || "" }));
      }).catch(() => setAirlines([]));
    }
  }, [isOpen, item, resource]);

  if (!isOpen) {
    return null;
  }

  const setField = (name, value) => setValues((current) => ({ ...current, [name]: value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = toMasterPayload(resource, values);
      const action = item
        ? resource === "airports" ? adminService.updateAirport(item.id, payload) : resource === "airlines" ? adminService.updateAirline(item.id, payload) : adminService.updateAircraft(item.id, payload)
        : resource === "airports" ? adminService.createAirport(payload) : resource === "airlines" ? adminService.createAirline(payload) : adminService.createAircraft(payload);
      await action;
      toast.success(item ? "Đã cập nhật dữ liệu." : "Đã tạo dữ liệu mới.");
      await onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể lưu dữ liệu."));
    } finally {
      setIsSaving(false);
    }
  };

  return <Modal isOpen onClose={onClose} title={item ? "Cập nhật dữ liệu" : "Thêm dữ liệu mới"}><form className="grid gap-4" onSubmit={handleSubmit}>{resource === "aircrafts" ? <Field label="Hãng bay"><select className={fieldClass} onChange={(event) => setField("airlineId", event.target.value)} required value={values.airlineId}>{airlines.map((airline) => <option key={airline.id} value={airline.id}>{airline.code} · {airline.name}</option>)}</select></Field> : null}<Field label={resource === "airports" ? "Mã IATA" : resource === "airlines" ? "Mã hãng" : "Mã tàu bay"}><input className={fieldClass} maxLength={resource === "airports" ? 3 : 20} onChange={(event) => setField("code", event.target.value.toUpperCase())} required value={values.code} /></Field>{resource === "airports" ? <><Field label="Tên sân bay"><input className={fieldClass} onChange={(event) => setField("name", event.target.value)} required value={values.name} /></Field><Field label="Thành phố"><input className={fieldClass} onChange={(event) => setField("city", event.target.value)} required value={values.city} /></Field><Field label="Quốc gia"><input className={fieldClass} onChange={(event) => setField("country", event.target.value)} required value={values.country} /></Field><Field label="Múi giờ IANA"><input className={fieldClass} onChange={(event) => setField("timezone", event.target.value)} required value={values.timezone} /></Field></> : null}{resource === "airlines" ? <><Field label="Tên hãng"><input className={fieldClass} onChange={(event) => setField("name", event.target.value)} required value={values.name} /></Field><Field label="Quốc gia"><input className={fieldClass} onChange={(event) => setField("country", event.target.value)} value={values.country} /></Field><Field label="URL logo"><input className={fieldClass} onChange={(event) => setField("logoUrl", event.target.value)} type="url" value={values.logoUrl} /></Field><label className="flex items-center gap-2 text-body-md"><input checked={values.isActive} onChange={(event) => setField("isActive", event.target.checked)} type="checkbox" />Đang hoạt động</label></> : null}{resource === "aircrafts" ? <><Field label="Dòng máy bay"><input className={fieldClass} onChange={(event) => setField("model", event.target.value)} required value={values.model} /></Field><Field label="Tổng số ghế"><input className={fieldClass} max="1000" min="1" onChange={(event) => setField("totalSeats", event.target.value)} required type="number" value={values.totalSeats} /></Field></> : null}<div className="flex justify-end gap-3"><Button onClick={onClose} type="button" variant="admin">Hủy</Button><Button disabled={isSaving} type="submit" variant="admin">{isSaving ? "Đang lưu..." : "Lưu"}</Button></div></form></Modal>;
}

function Field({ children, label }) {
  return <label className="grid gap-2 text-label-md text-on-surface">{label}{children}</label>;
}

function toMasterValues(resource, item) {
  if (resource === "airports") {
    return { code: item?.code ?? "", name: item?.name ?? "", city: item?.city ?? "", country: item?.country ?? "Vietnam", timezone: item?.timezone ?? "Asia/Ho_Chi_Minh" };
  }
  if (resource === "airlines") {
    return { code: item?.code ?? "", name: item?.name ?? "", country: item?.country ?? "", logoUrl: item?.logo_url ?? "", isActive: item?.is_active ?? true };
  }
  return { airlineId: item?.airline_id ?? "", code: item?.code ?? "", model: item?.model ?? "", totalSeats: item?.total_seats ?? "" };
}

function toMasterPayload(resource, values) {
  if (resource === "airports") {
    return values;
  }
  if (resource === "airlines") {
    return { ...values, logoUrl: values.logoUrl || null, country: values.country || null };
  }
  return { ...values, totalSeats: Number(values.totalSeats) };
}
