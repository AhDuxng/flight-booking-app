import { CircleAlert, RotateCcw } from "lucide-react";
import Button from "@/components/common/Button";

export default function ErrorMessage({ message = "Đã có lỗi xảy ra. Vui lòng thử lại.", onRetry }) {
  return (
    <div className="rounded-lg border border-error-container bg-error-container/40 p-stack-md text-on-error-container">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 h-5 w-5 flex-none" />
        <div className="min-w-0 flex-1">
          <p className="text-title-lg font-title-lg">Không thể tải dữ liệu</p>
          <p className="mt-1 text-body-md font-body-md">{message}</p>
          {onRetry ? (
            <Button className="mt-4" icon={RotateCcw} onClick={onRetry} size="sm" type="button" variant="outline">
              Thử lại
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
