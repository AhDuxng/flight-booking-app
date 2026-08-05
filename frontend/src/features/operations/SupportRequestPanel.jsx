import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/apiError";
import { operationService } from "./operationService";

export default function SupportRequestPanel() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({
    category: "booking",
    subject: "",
    description: "",
    priority: "normal",
  });
  const [busy, setBusy] = useState(false);
  const load = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await operationService.getSupportTickets();
      setTickets(response.data ?? []);
    } catch {
      setTickets([]);
    }
  };
  useEffect(() => {
    load();
  }, [isAuthenticated]);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await operationService.createSupportTicket(form);
      toast.success("Đã tạo yêu cầu hỗ trợ.");
      setForm({ category: "booking", subject: "", description: "", priority: "normal" });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tạo yêu cầu hỗ trợ."));
    } finally {
      setBusy(false);
    }
  };
  const reply = async (ticket) => {
    const body = window.prompt(`Phản hồi ${ticket.reference}`);
    if (!body?.trim()) return;
    try {
      await operationService.addSupportMessage(ticket.id, body.trim());
      toast.success("Đã gửi phản hồi.");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi phản hồi."));
    }
  };
  return (
    <section className="bg-surface-container-low px-container-padding py-section-gap">
      <div className="mx-auto grid max-w-7xl gap-stack-lg lg:grid-cols-2">
        <div>
          <h2 className="flex items-center gap-2 text-headline-lg text-primary">
            <LifeBuoy className="h-6 w-6" />
            Yêu cầu hỗ trợ có theo dõi
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Mỗi yêu cầu có mã tham chiếu, mức ưu tiên, SLA và lịch sử trao đổi.
          </p>
          {!isAuthenticated ? (
            <Link
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary"
              to="/login?redirect=/support"
            >
              Đăng nhập để gửi yêu cầu
            </Link>
          ) : (
            <form
              className="mt-5 space-y-3 rounded-xl bg-surface-container-lowest p-container-padding shadow-sm"
              onSubmit={submit}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className={inputClass}
                  onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                  value={form.category}
                >
                  <option value="booking">Đặt chỗ</option>
                  <option value="payment">Thanh toán</option>
                  <option value="refund">Hoàn tiền</option>
                  <option value="baggage">Hành lý</option>
                  <option value="flight_change">Đổi chuyến</option>
                  <option value="other">Khác</option>
                </select>
                <select
                  className={inputClass}
                  onChange={(e) => setForm((current) => ({ ...current, priority: e.target.value }))}
                  value={form.priority}
                >
                  <option value="normal">Bình thường · SLA 24h</option>
                  <option value="high">Cao · SLA 8h</option>
                  <option value="urgent">Khẩn cấp · SLA 2h</option>
                </select>
              </div>
              <input
                className={inputClass}
                maxLength={160}
                onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
                placeholder="Tiêu đề yêu cầu"
                required
                value={form.subject}
              />
              <textarea
                className={`${inputClass} min-h-28 py-3`}
                minLength={10}
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
                placeholder="Mô tả chi tiết tình huống"
                required
                value={form.description}
              />
              <button
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-on-primary disabled:opacity-50"
                disabled={busy}
                type="submit"
              >
                <Send className="h-4 w-4" />
                {busy ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </form>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="text-title-lg text-primary">Yêu cầu gần đây</h3>
          {tickets.length ? (
            tickets.map((ticket) => (
              <article
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                key={ticket.id}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{ticket.reference}</strong>
                  <span className="rounded-full bg-primary-fixed px-2 py-1 text-xs uppercase text-primary">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{ticket.subject}</p>
                <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
                  {ticket.description}
                </p>
                <p className="mt-3 text-xs text-on-surface-variant">
                  SLA:{" "}
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(ticket.sla_due_at))}
                </p>
                {ticket.support_messages?.length ? (
                  <div className="mt-3 space-y-1 border-t border-outline-variant pt-3">
                    {ticket.support_messages.slice(-3).map((message) => (
                      <p className="rounded bg-surface-container p-2 text-xs" key={message.id}>
                        {message.body}
                      </p>
                    ))}
                  </div>
                ) : null}
                {!["resolved", "closed"].includes(ticket.status) ? (
                  <button
                    className="mt-3 text-sm font-semibold text-primary underline"
                    onClick={() => reply(ticket)}
                    type="button"
                  >
                    Phản hồi
                  </button>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
              Chưa có yêu cầu hỗ trợ.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md outline-none focus:border-primary";
