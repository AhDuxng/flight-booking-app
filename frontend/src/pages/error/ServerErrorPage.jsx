import { ServerCrash } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

export default function ServerErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-container-padding py-section-gap">
      <section className="max-w-md rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-lg text-center shadow-sm">
        <ServerCrash className="mx-auto mb-4 h-12 w-12 text-status-warning" />
        <h1 className="text-headline-lg font-headline-lg text-primary">Hệ thống đang gián đoạn</h1>
        <p className="mt-3 text-body-md font-body-md text-on-surface-variant">
          Vui lòng thử lại sau ít phút hoặc liên hệ bộ phận hỗ trợ nếu cần xử lý gấp.
        </p>
        <Button as={Link} className="mt-6" to="/support">
          Liên hệ hỗ trợ
        </Button>
      </section>
    </main>
  );
}
