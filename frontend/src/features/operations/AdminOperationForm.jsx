import { useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import CurrencyInput from "@/components/common/CurrencyInput";

const fieldClass =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const textAreaClass = `${fieldClass} min-h-28 resize-y py-3`;

const today = () => new Date().toISOString().slice(0, 10);
const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);
const numberOrZero = (value) => Number(value || 0);
const nullable = (value) => value || null;

const defaults = {
  routes: {
    origin_airport_id: "",
    destination_airport_id: "",
    code: "",
    default_duration_minutes: 120,
    is_active: true,
  },
  flight_schedules: {
    route_id: "",
    airline_id: "",
    aircraft_id: "",
    flight_number: "",
    departure_local_time: "08:00",
    arrival_day_offset: 0,
    duration_minutes: 120,
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    start_date: today(),
    end_date: "",
    base_price: 850000,
    is_active: true,
  },
  fare_classes: {
    airline_id: "",
    route_id: "",
    code: "",
    name: "",
    cabin_class: "economy",
    price_multiplier: 1,
    change_allowed: true,
    change_fee: 0,
    refundable: false,
    cancellation_fee: 0,
    checked_baggage_kg: 0,
    cabin_baggage_kg: 7,
    priority_boarding: false,
    is_active: true,
  },
  flight_status_events: {
    flight_id: "",
    status: "delayed",
    message: "",
    gate: "",
    terminal: "",
    baggage_carousel: "",
    estimated_departure_time: "",
    estimated_arrival_time: "",
  },
  cms_contents: {
    type: "news",
    slug: "",
    title: "",
    summary: "",
    body: "",
    image_url: "",
    status: "draft",
    published_at: "",
    metadata: {},
  },
  ancillary_services: {
    code: "",
    type: "insurance",
    name: "",
    description: "",
    price: 0,
    currency: "VND",
    rules: {},
    is_active: true,
  },
};

const relationKeys = new Set([
  "id",
  "created_at",
  "updated_at",
  "origin_airport",
  "destination_airport",
  "airline",
  "aircraft",
  "route",
  "flight",
]);

const initialValue = (resource, row) => {
  const base = { ...defaults[resource] };
  if (!row) return base;
  for (const [key, value] of Object.entries(row)) {
    if (!relationKeys.has(key) && key in base) base[key] = value ?? "";
  }
  if (resource === "flight_status_events") {
    base.estimated_departure_time = toLocalDateTime(row.estimated_departure_time);
    base.estimated_arrival_time = toLocalDateTime(row.estimated_arrival_time);
  }
  if (resource === "cms_contents") base.published_at = toLocalDateTime(row.published_at);
  return base;
};

const buildPayload = (resource, value) => {
  if (resource === "routes") {
    return {
      origin_airport_id: value.origin_airport_id,
      destination_airport_id: value.destination_airport_id,
      code: value.code.trim().toUpperCase(),
      default_duration_minutes: numberOrZero(value.default_duration_minutes),
      is_active: value.is_active,
    };
  }
  if (resource === "flight_schedules") {
    return {
      route_id: value.route_id,
      airline_id: value.airline_id,
      aircraft_id: value.aircraft_id,
      flight_number: value.flight_number.replaceAll(" ", "").toUpperCase(),
      departure_local_time: value.departure_local_time,
      arrival_day_offset: numberOrZero(value.arrival_day_offset),
      duration_minutes: numberOrZero(value.duration_minutes),
      days_of_week: value.days_of_week.map(Number).sort(),
      start_date: value.start_date,
      end_date: nullable(value.end_date),
      base_price: numberOrZero(value.base_price),
      is_active: value.is_active,
    };
  }
  if (resource === "fare_classes") {
    return {
      airline_id: nullable(value.airline_id),
      route_id: nullable(value.route_id),
      code: value.code.trim().toUpperCase(),
      name: value.name.trim(),
      cabin_class: value.cabin_class,
      price_multiplier: Number(value.price_multiplier),
      change_allowed: value.change_allowed,
      change_fee: numberOrZero(value.change_fee),
      refundable: value.refundable,
      cancellation_fee: numberOrZero(value.cancellation_fee),
      checked_baggage_kg: numberOrZero(value.checked_baggage_kg),
      cabin_baggage_kg: numberOrZero(value.cabin_baggage_kg),
      priority_boarding: value.priority_boarding,
      is_active: value.is_active,
    };
  }
  if (resource === "flight_status_events") {
    return {
      flight_id: value.flight_id,
      status: value.status,
      message: nullable(value.message.trim()),
      gate: nullable(value.gate.trim()),
      terminal: nullable(value.terminal.trim()),
      baggage_carousel: nullable(value.baggage_carousel.trim()),
      estimated_departure_time: toIsoOrNull(value.estimated_departure_time),
      estimated_arrival_time: toIsoOrNull(value.estimated_arrival_time),
    };
  }
  if (resource === "cms_contents") {
    return {
      type: value.type,
      slug: value.slug.trim().toLowerCase(),
      title: value.title.trim(),
      summary: nullable(value.summary.trim()),
      body: value.body.trim(),
      image_url: nullable(value.image_url.trim()),
      status: value.status,
      published_at:
        value.status === "published"
          ? (toIsoOrNull(value.published_at) ?? new Date().toISOString())
          : toIsoOrNull(value.published_at),
      metadata: value.metadata ?? {},
    };
  }
  return {
    code: value.code.trim().toUpperCase(),
    type: value.type,
    name: value.name.trim(),
    description: nullable(value.description.trim()),
    price: numberOrZero(value.price),
    currency: value.currency.trim().toUpperCase(),
    rules: value.rules ?? {},
    is_active: value.is_active,
  };
};

export default function AdminOperationForm({ resource, row, options, onCancel, onSubmit }) {
  const [value, setValue] = useState(() => initialValue(resource, row));
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const aircrafts = useMemo(
    () =>
      (options.aircrafts ?? []).filter(
        (aircraft) => !value.airline_id || aircraft.airline_id === value.airline_id,
      ),
    [options.aircrafts, value.airline_id],
  );
  const change = (key, nextValue) => {
    setValidationError("");
    setValue((current) => {
      const next = { ...current, [key]: nextValue };
      if (resource === "routes" && ["origin_airport_id", "destination_airport_id"].includes(key)) {
        const origin = options.airports?.find((airport) => airport.id === next.origin_airport_id);
        const destination = options.airports?.find(
          (airport) => airport.id === next.destination_airport_id,
        );
        if (origin && destination) next.code = `${origin.code}-${destination.code}`;
      }
      if (resource === "flight_schedules" && key === "airline_id") next.aircraft_id = "";
      return next;
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (resource === "routes" && value.origin_airport_id === value.destination_airport_id) {
      setValidationError("Điểm đi và điểm đến phải khác nhau.");
      return;
    }
    if (resource === "flight_schedules" && value.days_of_week.length === 0) {
      setValidationError("Vui lòng chọn ít nhất một ngày hoạt động.");
      return;
    }
    if (resource === "flight_schedules" && value.end_date && value.end_date < value.start_date) {
      setValidationError("Ngày kết thúc không được trước ngày bắt đầu.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(buildPayload(resource, value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="mb-5 rounded-xl border border-primary bg-surface-container-lowest p-5"
      onSubmit={submit}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-title-lg text-primary">{row ? "Cập nhật" : "Tạo mới"}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Điền thông tin bên dưới; các trường có dấu * là bắt buộc.
          </p>
        </div>
        <div className="flex gap-2">
          <button className={secondaryButton} onClick={onCancel} type="button">
            <X className="h-4 w-4" /> Hủy
          </button>
          <button className={primaryButton} disabled={saving} type="submit">
            <Save className="h-4 w-4" /> {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
      {validationError ? (
        <p
          className="mb-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resource === "routes" ? (
          <>
            <SelectField
              label="Điểm đi *"
              onChange={(v) => change("origin_airport_id", v)}
              required
              value={value.origin_airport_id}
            >
              <OptionList
                items={options.airports}
                label={(item) => `${item.code} - ${item.city}`}
              />
            </SelectField>
            <SelectField
              label="Điểm đến *"
              onChange={(v) => change("destination_airport_id", v)}
              required
              value={value.destination_airport_id}
            >
              <OptionList
                items={(options.airports ?? []).filter(
                  (airport) => airport.id !== value.origin_airport_id,
                )}
                label={(item) => `${item.code} - ${item.city}`}
              />
            </SelectField>
            <TextField
              label="Mã tuyến *"
              onChange={(v) => change("code", v)}
              required
              value={value.code}
            />
            <TextField
              label="Thời gian bay mặc định (phút) *"
              min="1"
              onChange={(v) => change("default_duration_minutes", v)}
              required
              type="number"
              value={value.default_duration_minutes}
            />
            <Toggle
              checked={value.is_active}
              label="Đang hoạt động"
              onChange={(v) => change("is_active", v)}
            />
          </>
        ) : null}

        {resource === "flight_schedules" ? (
          <>
            <SelectField
              label="Tuyến bay *"
              onChange={(v) => change("route_id", v)}
              required
              value={value.route_id}
            >
              <OptionList items={options.routes} label={(item) => item.code} />
            </SelectField>
            <SelectField
              label="Hãng bay *"
              onChange={(v) => change("airline_id", v)}
              required
              value={value.airline_id}
            >
              <OptionList
                items={options.airlines}
                label={(item) => `${item.code} - ${item.name}`}
              />
            </SelectField>
            <SelectField
              label="Tàu bay *"
              onChange={(v) => change("aircraft_id", v)}
              required
              value={value.aircraft_id}
            >
              <OptionList items={aircrafts} label={(item) => `${item.code} - ${item.model}`} />
            </SelectField>
            <TextField
              label="Mã chuyến bay *"
              onChange={(v) => change("flight_number", v)}
              required
              value={value.flight_number}
            />
            <TextField
              label="Giờ khởi hành *"
              onChange={(v) => change("departure_local_time", v)}
              required
              type="time"
              value={value.departure_local_time}
            />
            <TextField
              label="Thời gian bay (phút) *"
              min="1"
              onChange={(v) => change("duration_minutes", v)}
              required
              type="number"
              value={value.duration_minutes}
            />
            <SelectField
              label="Ngày đến"
              onChange={(v) => change("arrival_day_offset", v)}
              value={value.arrival_day_offset}
            >
              <option value="0">Cùng ngày</option>
              <option value="1">Ngày hôm sau</option>
              <option value="2">Sau 2 ngày</option>
            </SelectField>
            <TextField
              label="Ngày bắt đầu *"
              onChange={(v) => change("start_date", v)}
              required
              type="date"
              value={value.start_date}
            />
            <TextField
              label="Ngày kết thúc"
              min={value.start_date}
              onChange={(v) => change("end_date", v)}
              type="date"
              value={value.end_date}
            />
            <CurrencyField
              label="Giá cơ bản *"
              onChange={(v) => change("base_price", v)}
              value={value.base_price}
            />
            <DayPicker
              onChange={(days) => change("days_of_week", days)}
              value={value.days_of_week}
            />
            <Toggle
              checked={value.is_active}
              label="Lịch đang hoạt động"
              onChange={(v) => change("is_active", v)}
            />
          </>
        ) : null}

        {resource === "fare_classes" ? (
          <>
            <TextField
              label="Mã hạng giá *"
              onChange={(v) => change("code", v)}
              required
              value={value.code}
            />
            <TextField
              label="Tên hạng giá *"
              onChange={(v) => change("name", v)}
              required
              value={value.name}
            />
            <SelectField
              label="Hạng ghế *"
              onChange={(v) => change("cabin_class", v)}
              value={value.cabin_class}
            >
              <option value="economy">Phổ thông</option>
              <option value="business">Thương gia</option>
              <option value="first">Hạng nhất</option>
            </SelectField>
            <SelectField
              label="Áp dụng cho hãng"
              onChange={(v) => change("airline_id", v)}
              value={value.airline_id}
            >
              <option value="">Tất cả hãng</option>
              <OptionList
                items={options.airlines}
                label={(item) => `${item.code} - ${item.name}`}
                placeholder={false}
              />
            </SelectField>
            <SelectField
              label="Áp dụng cho tuyến"
              onChange={(v) => change("route_id", v)}
              value={value.route_id}
            >
              <option value="">Tất cả tuyến</option>
              <OptionList items={options.routes} label={(item) => item.code} placeholder={false} />
            </SelectField>
            <TextField
              label="Hệ số giá *"
              min="0.001"
              onChange={(v) => change("price_multiplier", v)}
              required
              step="0.001"
              type="number"
              value={value.price_multiplier}
            />
            <CurrencyField
              label="Phí đổi chuyến"
              onChange={(v) => change("change_fee", v)}
              value={value.change_fee}
            />
            <CurrencyField
              label="Phí hủy vé"
              onChange={(v) => change("cancellation_fee", v)}
              value={value.cancellation_fee}
            />
            <TextField
              label="Hành lý ký gửi (kg)"
              min="0"
              onChange={(v) => change("checked_baggage_kg", v)}
              type="number"
              value={value.checked_baggage_kg}
            />
            <TextField
              label="Hành lý xách tay (kg)"
              min="0"
              onChange={(v) => change("cabin_baggage_kg", v)}
              type="number"
              value={value.cabin_baggage_kg}
            />
            <Toggle
              checked={value.change_allowed}
              label="Cho phép đổi chuyến"
              onChange={(v) => change("change_allowed", v)}
            />
            <Toggle
              checked={value.refundable}
              label="Cho phép hoàn vé"
              onChange={(v) => change("refundable", v)}
            />
            <Toggle
              checked={value.priority_boarding}
              label="Ưu tiên lên máy bay"
              onChange={(v) => change("priority_boarding", v)}
            />
            <Toggle
              checked={value.is_active}
              label="Đang áp dụng"
              onChange={(v) => change("is_active", v)}
            />
          </>
        ) : null}

        {resource === "flight_status_events" ? (
          <>
            <SelectField
              label="Chuyến bay *"
              onChange={(v) => change("flight_id", v)}
              required
              value={value.flight_id}
              wrapperClassName="md:col-span-2"
            >
              <OptionList
                items={options.flights}
                label={(item) =>
                  `${item.flight_number} · ${item.origin_airport?.code}-${item.destination_airport?.code} · ${new Date(item.departure_time).toLocaleString("vi-VN")}`
                }
              />
            </SelectField>
            <SelectField
              label="Trạng thái mới *"
              onChange={(v) => change("status", v)}
              value={value.status}
            >
              <option value="scheduled">Đã lên lịch</option>
              <option value="delayed">Chậm chuyến</option>
              <option value="boarding">Đang lên máy bay</option>
              <option value="departed">Đã khởi hành</option>
              <option value="arrived">Đã đến</option>
              <option value="cancelled">Hủy chuyến</option>
            </SelectField>
            <TextField
              label="Cửa ra máy bay"
              onChange={(v) => change("gate", v)}
              value={value.gate}
            />
            <TextField
              label="Nhà ga"
              onChange={(v) => change("terminal", v)}
              value={value.terminal}
            />
            <TextField
              label="Băng chuyền hành lý"
              onChange={(v) => change("baggage_carousel", v)}
              value={value.baggage_carousel}
            />
            <TextField
              label="Khởi hành dự kiến"
              onChange={(v) => change("estimated_departure_time", v)}
              type="datetime-local"
              value={value.estimated_departure_time}
            />
            <TextField
              label="Đến dự kiến"
              onChange={(v) => change("estimated_arrival_time", v)}
              type="datetime-local"
              value={value.estimated_arrival_time}
            />
            <TextArea
              label="Thông báo cho hành khách"
              onChange={(v) => change("message", v)}
              value={value.message}
              wrapperClassName="md:col-span-2 xl:col-span-3"
            />
          </>
        ) : null}

        {resource === "cms_contents" ? (
          <>
            <SelectField
              label="Loại nội dung *"
              onChange={(v) => change("type", v)}
              value={value.type}
            >
              <option value="news">Tin tức</option>
              <option value="promotion">Khuyến mãi</option>
              <option value="banner">Banner</option>
              <option value="faq">Câu hỏi thường gặp</option>
              <option value="policy">Chính sách</option>
              <option value="terms">Điều khoản</option>
            </SelectField>
            <TextField
              label="Đường dẫn (slug) *"
              onChange={(v) => change("slug", v)}
              required
              value={value.slug}
            />
            <SelectField
              label="Trạng thái *"
              onChange={(v) => change("status", v)}
              value={value.status}
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Lưu trữ</option>
            </SelectField>
            <TextField
              label="Tiêu đề *"
              onChange={(v) => change("title", v)}
              required
              value={value.title}
              wrapperClassName="md:col-span-2"
            />
            <TextField
              label="Thời gian xuất bản"
              onChange={(v) => change("published_at", v)}
              type="datetime-local"
              value={value.published_at}
            />
            <TextField
              label="URL hình ảnh"
              onChange={(v) => change("image_url", v)}
              type="url"
              value={value.image_url}
              wrapperClassName="md:col-span-2 xl:col-span-3"
            />
            <TextArea
              label="Tóm tắt"
              onChange={(v) => change("summary", v)}
              value={value.summary}
              wrapperClassName="md:col-span-2 xl:col-span-3"
            />
            <TextArea
              label="Nội dung *"
              onChange={(v) => change("body", v)}
              required
              value={value.body}
              wrapperClassName="md:col-span-2 xl:col-span-3"
            />
          </>
        ) : null}

        {resource === "ancillary_services" ? (
          <>
            <TextField
              label="Mã dịch vụ *"
              onChange={(v) => change("code", v)}
              required
              value={value.code}
            />
            <TextField
              label="Tên dịch vụ *"
              onChange={(v) => change("name", v)}
              required
              value={value.name}
            />
            <SelectField
              label="Loại dịch vụ *"
              onChange={(v) => change("type", v)}
              value={value.type}
            >
              <option value="insurance">Bảo hiểm</option>
              <option value="transfer">Đưa đón</option>
              <option value="upgrade">Nâng hạng</option>
              <option value="pet">Thú cưng</option>
            </SelectField>
            <CurrencyField
              label="Giá dịch vụ *"
              onChange={(v) => change("price", v)}
              value={value.price}
            />
            <TextField
              label="Tiền tệ *"
              maxLength="3"
              onChange={(v) => change("currency", v)}
              required
              value={value.currency}
            />
            <Toggle
              checked={value.is_active}
              label="Đang cung cấp"
              onChange={(v) => change("is_active", v)}
            />
            <TextArea
              label="Mô tả"
              onChange={(v) => change("description", v)}
              value={value.description}
              wrapperClassName="md:col-span-2 xl:col-span-3"
            />
          </>
        ) : null}
      </div>
    </form>
  );
}

function FieldLabel({ children, wrapperClassName = "", ...props }) {
  return (
    <label className={`block min-w-0 ${wrapperClassName}`} {...props}>
      {children}
    </label>
  );
}
function TextField({ label, onChange, wrapperClassName, ...props }) {
  return (
    <FieldLabel wrapperClassName={wrapperClassName}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input className={fieldClass} onChange={(event) => onChange(event.target.value)} {...props} />
    </FieldLabel>
  );
}
function TextArea({ label, onChange, wrapperClassName, ...props }) {
  return (
    <FieldLabel wrapperClassName={wrapperClassName}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <textarea
        className={textAreaClass}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </FieldLabel>
  );
}
function SelectField({ children, label, onChange, wrapperClassName, ...props }) {
  return (
    <FieldLabel wrapperClassName={wrapperClassName}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <select className={fieldClass} onChange={(event) => onChange(event.target.value)} {...props}>
        {children}
      </select>
    </FieldLabel>
  );
}
function OptionList({ items = [], label, placeholder = true }) {
  return (
    <>
      {placeholder ? <option value="">-- Chọn --</option> : null}
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {label(item)}
        </option>
      ))}
    </>
  );
}
function CurrencyField({ label, onChange, value }) {
  return <CurrencyInput label={label} min="0" onValueChange={onChange} required value={value} />;
}
function Toggle({ checked, label, onChange }) {
  return (
    <label className="flex h-11 items-center gap-3 self-end rounded-lg border border-outline-variant px-3">
      <input
        checked={checked}
        className="h-4 w-4 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}
function DayPicker({ onChange, value }) {
  const days = [
    [1, "T2"],
    [2, "T3"],
    [3, "T4"],
    [4, "T5"],
    [5, "T6"],
    [6, "T7"],
    [7, "CN"],
  ];
  return (
    <fieldset className="md:col-span-2">
      <legend className="mb-2 text-sm font-semibold">Ngày hoạt động *</legend>
      <div className="flex flex-wrap gap-2">
        {days.map(([day, label]) => (
          <label
            className="flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2"
            key={day}
          >
            <input
              checked={value.includes(day)}
              onChange={(event) =>
                onChange(
                  event.target.checked ? [...value, day] : value.filter((item) => item !== day),
                )
              }
              type="checkbox"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const secondaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-sm font-semibold text-primary";
const primaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50";
