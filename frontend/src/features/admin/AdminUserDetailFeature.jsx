import { useEffect, useState } from "react";
import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { formatCurrency } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import AdminPageHeader from "./AdminPageHeader";
import { adminService } from "./adminService";

export default function AdminUserDetailFeature() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.getUserById(userId);
        setUser(response.data);
        setBookings(response.data.bookings ?? []);
        setError("");
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải thông tin người dùng."));
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  if (isLoading) {
    return <Loading label="Đang tải người dùng" />;
  }

  if (error || !user) {
    return <ErrorMessage message={error || "Không tìm thấy người dùng."} />;
  }

  return <div className="flex min-w-0 flex-col gap-stack-md"><AdminPageHeader description="Xem hồ sơ người dùng và các hoạt động liên quan." title={user.full_name || "Người dùng chưa đặt tên"} /><section className="grid grid-cols-1 gap-stack-md lg:grid-cols-3"><article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm"><div className="mb-stack-md flex h-14 w-14 items-center justify-center rounded-lg bg-primary-fixed text-primary"><UserRound className="h-7 w-7" /></div><h2 className="text-title-lg text-primary">{user.full_name || "Chưa cập nhật"}</h2><p className="mt-2 flex items-center gap-2 text-body-md text-on-surface-variant"><Mail className="h-4 w-4" />{user.email || "Chưa có email"}</p><p className="mt-2 flex items-center gap-2 text-body-md text-on-surface-variant"><Phone className="h-4 w-4" />{user.phone || "Chưa có số điện thoại"}</p><p className="mt-2 text-body-md text-on-surface-variant">Quốc tịch: {user.nationality || "Chưa cập nhật"}</p><span className="mt-stack-md inline-flex items-center gap-1 rounded-full border border-primary-fixed bg-primary-fixed px-2.5 py-0.5 text-label-md text-primary"><ShieldCheck className="h-3.5 w-3.5" />{user.role === "admin" ? "Quản trị viên" : "Tài khoản khách hàng"}</span></article><article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm lg:col-span-2"><h2 className="mb-stack-md text-title-lg text-primary">Đơn đặt vé liên quan</h2><div className="grid gap-stack-sm">{bookings.length ? bookings.map((booking) => <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3" key={booking.id}><div><p className="font-data-mono text-label-md text-primary">{booking.id}</p><p className="text-body-sm text-on-surface-variant">{booking.flight?.flight_number ?? "-"} · {booking.status}</p></div><span className="font-data-mono text-body-sm text-on-surface">{formatCurrency(booking.total_price)}</span></div>) : <p className="rounded-lg bg-surface-container-low p-3 text-body-md text-on-surface-variant">Người dùng này chưa có đơn đặt vé.</p>}</div></article><ActivityPanel items={user.reviews} title="Đánh giá gần đây" render={(item) => `${item.rating}/5 · ${item.comment || "Không có nhận xét"}`} /><ActivityPanel items={user.notifications} title="Thông báo gần đây" render={(item) => `${item.title} · ${item.read_at ? "Đã đọc" : "Chưa đọc"}`} /></section></div>;
}

function ActivityPanel({ items = [], title, render }) {
  return <article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm lg:col-span-3"><h2 className="mb-stack-md text-title-lg text-primary">{title}</h2><div className="grid gap-2">{items.length ? items.map((item) => <div className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface-variant" key={item.id}>{render(item)}</div>) : <p className="text-body-sm text-on-surface-variant">Chưa có dữ liệu.</p>}</div></article>;
}
