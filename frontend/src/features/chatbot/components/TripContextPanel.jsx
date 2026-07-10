import { Link } from "react-router-dom";
import { ArrowRight, Headphones, Plane, Sparkles } from "lucide-react";

export default function TripContextPanel() {
  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-outline-variant bg-surface p-container-padding xl:flex">
      <section>
        <h2 className="mb-4 text-title-lg font-title-lg text-primary">Thông tin chuyến đi</h2>
        <div className="rounded-lg border border-primary/10 bg-primary-fixed/40 p-4">
          <div className="flex items-center justify-between text-headline-md font-semibold text-primary">
            <span>SGN</span>
            <Plane className="h-5 w-5 rotate-90" />
            <span>PQC</span>
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">Thứ Tư, 15 tháng 12 • 1 hành khách</p>
          <div className="mt-4 flex justify-between border-t border-outline-variant/50 pt-4 text-body-sm">
            <span>Giá tạm tính</span>
            <strong className="text-primary">1.250.000 VND</strong>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-4 text-title-lg font-title-lg text-primary">Chương trình thành viên</h2>
        <div className="rounded-lg border border-secondary/20 bg-secondary-container/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-on-secondary-container">
            <Sparkles className="h-5 w-5 text-secondary" />
            Hạng Vàng
          </div>
          <p className="mt-2 text-body-sm text-on-secondary-container">Bạn có 12.450 SkyMiles khả dụng.</p>
          <Link className="mt-3 inline-flex items-center gap-1 text-body-sm font-semibold text-secondary hover:underline" to="/profile">
            Xem quyền lợi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-auto rounded-lg bg-surface-container-high p-4">
        <p className="text-body-sm font-semibold text-primary">Cần gặp nhân viên hỗ trợ?</p>
        <p className="mt-1 text-xs text-on-surface-variant">Kết nối với đội ngũ VietFly trực 24/7.</p>
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
