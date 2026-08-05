import { useEffect, useMemo, useState } from "react";
import { Play, Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { operationService } from "./operationService";

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
const templates = {
  routes: {
    origin_airport_id: "UUID",
    destination_airport_id: "UUID",
    code: "HAN-SGN",
    default_duration_minutes: 130,
    is_active: true,
  },
  flight_schedules: {
    route_id: "UUID",
    airline_id: "UUID",
    aircraft_id: "UUID",
    flight_number: "VN123",
    departure_local_time: "08:00",
    duration_minutes: 130,
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
    base_price: 850000,
    is_active: true,
  },
  fare_classes: {
    code: "ECO-PROMO",
    name: "Economy Promo",
    cabin_class: "economy",
    price_multiplier: 1,
    change_allowed: true,
    change_fee: 350000,
    refundable: false,
    cancellation_fee: 500000,
    checked_baggage_kg: 0,
    cabin_baggage_kg: 7,
    priority_boarding: false,
    is_active: true,
  },
  flight_status_events: {
    flight_id: "UUID",
    status: "delayed",
    message: "Chuyến bay chậm do khai thác",
    gate: "A5",
    terminal: "T1",
    estimated_departure_time: new Date().toISOString(),
  },
  cms_contents: {
    type: "news",
    slug: "tin-moi",
    title: "Tiêu đề",
    summary: "Tóm tắt",
    body: "Nội dung",
    status: "published",
    published_at: new Date().toISOString(),
    metadata: {},
  },
  ancillary_services: {
    code: "NEW-SERVICE",
    type: "insurance",
    name: "Dịch vụ mới",
    description: "Mô tả",
    price: 100000,
    currency: "VND",
    rules: {},
    is_active: true,
  },
};

export default function AdminOperationsFeature() {
  const [resource, setResource] = useState("routes");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
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
  const open = (row) => {
    const value = row
      ? Object.fromEntries(
          Object.entries(row).filter(
            ([key]) =>
              ![
                "id",
                "created_at",
                "updated_at",
                "origin_airport",
                "destination_airport",
                "airline",
                "aircraft",
                "route",
                "booking",
                "payment",
                "flight",
                "support_messages",
              ].includes(key),
          ),
        )
      : (templates[resource] ?? {});
    setEditingId(row?.id ?? null);
    setEditor(JSON.stringify(value, null, 2));
    setShowEditor(true);
  };
  const save = async () => {
    try {
      const payload = JSON.parse(editor);
      if (editingId) await operationService.updateAdminResource(resource, editingId, payload);
      else await operationService.createAdminResource(resource, payload);
      toast.success("Đã lưu dữ liệu vận hành.");
      setShowEditor(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof SyntaxError
          ? "JSON không hợp lệ."
          : getErrorMessage(error, "Không thể lưu dữ liệu."),
      );
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
          <p className="text-label-md text-secondary">Network & Customer Operations</p>
          <h1 className="text-headline-lg text-primary">Vận hành MVP</h1>
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
          {templates[resource] ? (
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
        <section className="mb-5 rounded-xl border border-primary bg-surface-container-lowest p-4">
          <div className="mb-3 flex justify-between">
            <h2 className="text-title-lg text-primary">
              {editingId ? "Cập nhật" : "Tạo"} {label}
            </h2>
            <button className={primaryClass} onClick={save} type="button">
              <Save className="h-4 w-4" />
              Lưu
            </button>
          </div>
          <p className="mb-2 text-xs text-on-surface-variant">
            Các trường dùng đúng tên cột database; UUID có thể lấy ở các màn hình sân bay/hãng/tàu
            bay.
          </p>
          <textarea
            className="min-h-72 w-full rounded-lg bg-deep-navy p-4 font-mono text-sm text-white outline-none"
            onChange={(e) => setEditor(e.target.value)}
            spellCheck={false}
            value={editor}
          />
        </section>
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
                    <strong>
                      {row.title ??
                        row.name ??
                        row.subject ??
                        row.flight_number ??
                        row.route?.code ??
                        row.booking?.booking_reference ??
                        "-"}
                    </strong>
                    <small className="mt-1 block line-clamp-2 text-on-surface-variant">
                      {row.summary ??
                        row.description ??
                        row.message ??
                        row.reason ??
                        row.payment?.transaction_ref ??
                        ""}
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
                      {templates[resource] ? (
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
