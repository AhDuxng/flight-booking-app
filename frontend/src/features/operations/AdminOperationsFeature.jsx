import { useEffect, useMemo, useState } from "react";
import { Play, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { operationService } from "./operationService";
import AdminOperationForm from "./AdminOperationForm";

const resources = [
  ["routes", "Tuyến bay"],
  ["flight_schedules", "Lịch định kỳ"],
  ["fare_classes", "Hạng giá"],
  ["flight_status_events", "Trạng thái bay"],
  ["refund_requests", "Hoàn tiền"],
  ["cms_contents", "CMS"],
  ["support_tickets", "Hỗ trợ"],
  ["ancillary_services", "Dịch vụ bổ sung"],
];
const formResources = new Set([
  "routes",
  "flight_schedules",
  "fare_classes",
  "flight_status_events",
  "cms_contents",
  "ancillary_services",
]);
const editableResources = new Set([
  "routes",
  "flight_schedules",
  "fare_classes",
  "cms_contents",
  "ancillary_services",
]);

const getRowTitle = (resource, row) => {
  if (resource === "routes") {
    return `${row.origin_airport?.code ?? "?"} → ${row.destination_airport?.code ?? "?"}`;
  }
  if (resource === "flight_schedules") {
    return `${row.flight_number} · ${row.route?.code ?? "Chưa có tuyến"}`;
  }
  if (resource === "flight_status_events") {
    return `${row.flight?.flight_number ?? "Chuyến bay"} · ${row.status}`;
  }
  return (
    row.title ??
    row.name ??
    row.subject ??
    row.flight_number ??
    row.booking?.booking_reference ??
    "-"
  );
};

const getRowSubtitle = (resource, row) => {
  if (resource === "routes") {
    return `${row.origin_airport?.city ?? ""} → ${row.destination_airport?.city ?? ""} · ${row.default_duration_minutes} phút`;
  }
  if (resource === "flight_schedules") {
    return `${row.airline?.name ?? ""} · ${row.aircraft?.model ?? ""} · ${String(row.departure_local_time ?? "").slice(0, 5)}`;
  }
  if (resource === "fare_classes") {
    return `${row.cabin_class} · hệ số ×${row.price_multiplier}`;
  }
  if (resource === "refund_requests") {
    return `${row.reason ?? ""} · ${Number(row.requested_amount ?? 0).toLocaleString("vi-VN")}₫ · ${row.payment?.provider?.toUpperCase() ?? ""}`;
  }
  if (resource === "ancillary_services") {
    return `${row.description ?? ""} · ${Number(row.price ?? 0).toLocaleString("vi-VN")} ${row.currency ?? "VND"}`;
  }
  return row.summary ?? row.description ?? row.message ?? row.reason ?? "";
};

export default function AdminOperationsFeature() {
  const [resource, setResource] = useState("routes");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [formOptions, setFormOptions] = useState({
    airports: [],
    airlines: [],
    aircrafts: [],
    routes: [],
    flights: [],
  });
  const label = useMemo(() => resources.find(([key]) => key === resource)?.[1], [resource]);
  const load = async () => {
    setLoading(true);
    try {
      const response = await operationService.getAdminResource(resource);
      setRows(response.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải dữ liệu vận hành."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setShowEditor(false);
    load();
  }, [resource]);
  const loadFormOptions = async () => {
    try {
      const response = await operationService.getAdminFormOptions();
      setFormOptions(response.data ?? {});
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải danh mục cho biểu mẫu."));
    }
  };
  useEffect(() => {
    loadFormOptions();
  }, []);
  const open = (row) => {
    setEditingId(row?.id ?? null);
    setEditingRow(row ?? null);
    setShowEditor(true);
  };
  const save = async (payload) => {
    try {
      if (editingId) await operationService.updateAdminResource(resource, editingId, payload);
      else await operationService.createAdminResource(resource, payload);
      toast.success("Đã lưu dữ liệu vận hành.");
      setShowEditor(false);
      setEditingRow(null);
      setEditingId(null);
      await load();
      if (["routes", "flight_schedules", "flight_status_events"].includes(resource)) {
        await loadFormOptions();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể lưu dữ liệu."));
    }
  };
  const decideRefund = async (row, action) => {
    if (!window.confirm(`${action === "approve" ? "Duyệt" : "Từ chối"} yêu cầu hoàn tiền này?`))
      return;
    try {
      await operationService.decideRefund(row.id, {
        action,
        approvedAmount: action === "approve" ? Number(row.requested_amount) : undefined,
      });
      toast.success("Đã xử lý yêu cầu hoàn tiền.");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xử lý hoàn tiền."));
    }
  };
  const isMandatoryRefund = (row) =>
    row.metadata?.involuntary === true ||
    row.metadata?.latePayment === true ||
    Boolean(row.metadata?.changeRequestId || row.metadata?.failureCode);
  const generate = async () => {
    try {
      const response = await operationService.generateSchedules();
      toast.success(`Đã sinh ${response.data.createdFlights} chuyến bay mới.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể sinh lịch bay."));
    }
  };
  const replySupport = async (row) => {
    const body = window.prompt(`Phản hồi ${row.reference}`);
    if (!body?.trim()) return;
    try {
      await operationService.addAdminSupportMessage(row.id, body.trim());
      toast.success("Đã gửi phản hồi và thông báo khách hàng.");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi phản hồi."));
    }
  };
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label-md text-secondary">Điều hành khai thác & dịch vụ khách hàng</p>
          <h1 className="text-headline-lg text-primary">Vận hành hệ thống</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Quản lý tuyến/lịch, fare, trạng thái, refund, CMS, SLA và dịch vụ bổ sung.
          </p>
        </div>
        <div className="flex gap-2">
          {resource === "flight_schedules" ? (
            <button className={buttonClass} onClick={generate} type="button">
              <Play className="h-4 w-4" />
              Sinh chuyến 90 ngày
            </button>
          ) : null}
          <button className={buttonClass} onClick={load} type="button">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
          {formResources.has(resource) ? (
            <button className={primaryClass} onClick={() => open()} type="button">
              <Plus className="h-4 w-4" />
              Thêm
            </button>
          ) : null}
        </div>
      </header>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {resources.map(([key, name]) => (
          <button
            className={cn(
              "flex-none rounded-lg border px-3 py-2 text-sm",
              resource === key
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-lowest",
            )}
            key={key}
            onClick={() => setResource(key)}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>
      {showEditor ? (
        <AdminOperationForm
          key={`${resource}:${editingId ?? "new"}`}
          onCancel={() => setShowEditor(false)}
          onSubmit={save}
          options={formOptions}
          resource={resource}
          row={editingRow}
        />
      ) : null}
      {loading ? (
        <Loading label={`Đang tải ${label}`} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-container">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">Thông tin</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-outline-variant" key={row.id}>
                  <td className="max-w-44 truncate p-3 font-mono">
                    {row.reference ?? row.code ?? row.slug ?? row.id}
                  </td>
                  <td className="max-w-md p-3">
                    <strong>{getRowTitle(resource, row)}</strong>
                    <small className="mt-1 block line-clamp-2 text-on-surface-variant">
                      {getRowSubtitle(resource, row)}
                    </small>
                  </td>
                  <td className="p-3 uppercase">
                    {row.status ?? (row.is_active ? "active" : "inactive")}
                  </td>
                  <td className="p-3">
                    {row.sla_due_at
                      ? `SLA ${new Date(row.sla_due_at).toLocaleString("vi-VN")}`
                      : row.created_at
                        ? new Date(row.created_at).toLocaleString("vi-VN")
                        : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {editableResources.has(resource) ? (
                        <button className={buttonClass} onClick={() => open(row)} type="button">
                          Sửa
                        </button>
                      ) : null}
                      {resource === "refund_requests" &&
                      ["pending", "approved", "requires_review"].includes(row.status) ? (
                        <>
                          <button
                            className={primaryClass}
                            onClick={() => decideRefund(row, "approve")}
                            type="button"
                          >
                            Duyệt
                          </button>
                          {!isMandatoryRefund(row) ? (
                            <button
                              className={buttonClass}
                              onClick={() => decideRefund(row, "reject")}
                              type="button"
                            >
                              Từ chối
                            </button>
                          ) : (
                            <span className="self-center text-xs text-on-surface-variant">
                              Khoản hoàn bắt buộc
                            </span>
                          )}
                        </>
                      ) : null}
                      {resource === "support_tickets" ? (
                        <button
                          className={primaryClass}
                          onClick={() => replySupport(row)}
                          type="button"
                        >
                          Phản hồi
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <div className="p-10 text-center text-on-surface-variant">Chưa có dữ liệu.</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary px-3 text-sm font-semibold text-primary";
const primaryClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary";
