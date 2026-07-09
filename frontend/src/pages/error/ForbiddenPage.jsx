import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-container-padding py-section-gap">
      <section className="max-w-md rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg text-center shadow-sm">
        <ShieldX className="mx-auto mb-4 h-12 w-12 text-status-error" />
        <h1 className="text-headline-lg font-headline-lg text-primary">Bạn chưa có quyền truy cập</h1>
        <p className="mt-3 text-body-md font-body-md text-on-surface-variant">
          Khu vực này chỉ dành cho tài khoản có quyền phù hợp.
        </p>
        <Button as={Link} className="mt-6" to="/">
          Về trang chủ
        </Button>
      </section>
    </main>
  );
}
