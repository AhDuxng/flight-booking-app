import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import StatusBadge from "@/components/common/StatusBadge";
import AdminPageHeader from "./AdminPageHeader";
import { adminBookings, adminUsers } from "./adminMockData";

export default function AdminUserDetailFeature() {
  const { userId } = useParams();
  const user = adminUsers.find((item) => item.id === userId) ?? adminUsers[0];
  const userBookings = adminBookings.filter((booking) => booking.customer === user.name);

  return (
    <div className="flex min-w-0 flex-col gap-stack-md">
      <AdminPageHeader description="Xem thông tin tài khoản, vai trò và các đặt chỗ liên quan." title={user.name} />

      <section className="grid grid-cols-1 gap-stack-md lg:grid-cols-3">
        <article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm lg:col-span-1">
          <div className="mb-stack-md flex h-14 w-14 items-center justify-center rounded-lg bg-primary-fixed text-primary">
            <UserRound className="h-7 w-7" />
          </div>
          <h2 className="text-title-lg font-title-lg text-primary">{user.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-body-md font-body-md text-on-surface-variant">
            <Mail className="h-4 w-4" />
            {user.email}
          </p>
          <div className="mt-stack-md flex flex-wrap gap-2">
            <StatusBadge status={user.status}>Đang hoạt động</StatusBadge>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-fixed bg-primary-fixed px-2.5 py-0.5 text-label-md font-label-md text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.role}
            </span>
          </div>
        </article>

        <article className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm lg:col-span-2">
          <h2 className="mb-stack-md text-title-lg font-title-lg text-primary">Đơn đặt vé liên quan</h2>
          <div className="grid gap-stack-sm">
            {userBookings.length > 0 ? (
              userBookings.map((booking) => (
                <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3" key={booking.id}>
                  <div>
                    <p className="text-label-md font-label-md text-primary">{booking.id}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">{booking.route}</p>
                  </div>
                  <StatusBadge status={booking.status}>{booking.statusLabel}</StatusBadge>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-surface-container-low p-3 text-body-md font-body-md text-on-surface-variant">
                Người dùng này chưa có đơn đặt vé trong dữ liệu mẫu.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
