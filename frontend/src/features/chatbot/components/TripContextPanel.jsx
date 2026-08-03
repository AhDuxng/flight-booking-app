import { Link } from "react-router-dom";
import { ArrowRight, BadgePercent, Headphones, Plane, ReceiptText } from "lucide-react";

export default function TripContextPanel() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-outline-variant bg-surface p-container-padding xl:flex">
      <section>
        <h2 className="mb-4 text-title-lg font-title-lg text-primary">Tiện ích hành trình</h2>
        <div className="space-y-2 rounded-lg border border-primary/10 bg-primary-fixed/40 p-4">
          <QuickLink icon={Plane} label="Tìm chuyến bay" to="/" />
          <QuickLink icon={ReceiptText} label="Đặt chỗ của tôi" to="/my-bookings" />
          <QuickLink icon={BadgePercent} label="Khuyến mãi đang áp dụng" to="/promotions" />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-4 text-title-lg font-title-lg text-primary">Lưu ý</h2>
        <div className="rounded-lg border border-secondary/20 bg-secondary-container/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-on-secondary-container">
            <Headphones className="h-5 w-5 text-secondary" />
            Dữ liệu tài khoản được bảo vệ
          </div>
          <p className="mt-2 text-body-sm text-on-secondary-container">
            Không gửi mật khẩu, thông tin thẻ hoặc giấy tờ tùy thân cho chatbot.
          </p>
          <Link
            className="mt-3 inline-flex items-center gap-1 text-body-sm font-semibold text-secondary hover:underline"
            to="/support"
          >
            Xem trung tâm hỗ trợ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-auto rounded-lg bg-surface-container-high p-4">
        <p className="text-body-sm font-semibold text-primary">Cần gặp nhân viên hỗ trợ?</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Mở trung tâm hỗ trợ để xem kênh liên hệ hiện có.
        </p>
        <Link
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-surface-container-lowest text-body-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary"
          to="/support"
        >
          <Headphones className="h-4 w-4" />
          Kết nối nhân viên
        </Link>
      </section>
    </aside>
  );
}

function QuickLink({ icon: Icon, label, to }) {
  return (
    <Link
      className="flex items-center gap-2 rounded-md px-2 py-2 text-body-sm font-semibold text-primary hover:bg-surface-container-lowest"
      to={to}
    >
      <Icon className="h-4 w-4" />
      {label}
      <ArrowRight className="ml-auto h-4 w-4" />
    </Link>
  );
}
