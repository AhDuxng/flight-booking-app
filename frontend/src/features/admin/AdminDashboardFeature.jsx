import { Link } from "react-router-dom";
import { CalendarCheck, Plane, Users } from "lucide-react";
import Button from "@/components/common/Button";
import AdminDataTable from "./AdminDataTable";
import AdminPageHeader from "./AdminPageHeader";
import AdminStatCard from "./AdminStatCard";
import { adminResources } from "./adminResourceConfig";
import { adminBookings, adminFlights, adminStats } from "./adminMockData";

export default function AdminDashboardFeature() {
  return (
    <div className="flex min-w-0 flex-col gap-stack-md">
      <AdminPageHeader
        action={
          <Button as={Link} icon={Plane} to="/admin/flights/create">
            Tạo chuyến bay
          </Button>
        }
        description="Tổng quan vận hành bán vé, lịch bay và các giao dịch cần theo dõi trong ngày."
        title="Bảng điều khiển"
      />

      <div className="grid grid-cols-1 gap-gutter-md sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-stack-md xl:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-stack-sm">
          <SectionTitle icon={CalendarCheck} title="Đặt chỗ gần đây" to="/admin/bookings" />
          <AdminDataTable columns={adminResources.bookings.columns.slice(0, 5)} rows={adminBookings.slice(0, 3)} />
        </section>
        <section className="flex min-w-0 flex-col gap-stack-sm">
          <SectionTitle icon={Plane} title="Chuyến bay sắp khởi hành" to="/admin/flights" />
          <AdminDataTable columns={adminResources.flights.columns.slice(0, 5)} rows={adminFlights.slice(0, 3)} />
        </section>
      </div>

      <section className="rounded-lg border border-primary-container bg-primary p-stack-md text-on-primary shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-secondary-fixed">
              <Users className="h-5 w-5" />
              <span className="text-label-md font-label-md">Chăm sóc khách hàng</span>
            </div>
            <h2 className="text-title-lg font-title-lg">3 yêu cầu hỗ trợ đang chờ phản hồi</h2>
            <p className="mt-1 text-body-sm font-body-sm text-primary-fixed">
              Ưu tiên xử lý các đơn đổi chuyến và hoàn tiền trước giờ bay.
            </p>
          </div>
          <Button as={Link} to="/admin/reviews" variant="secondary">
            Xem hàng chờ
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, to }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2 text-primary">
        <Icon className="h-5 w-5 flex-none" />
        <h2 className="truncate text-title-lg font-title-lg">{title}</h2>
      </div>
      <Link className="flex-none text-label-md font-label-md text-primary hover:underline" to={to}>
        Xem tất cả
      </Link>
    </div>
  );
}
