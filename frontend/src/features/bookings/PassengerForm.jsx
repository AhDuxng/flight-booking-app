import { CalendarDays, Contact, Mail, Phone, UserRound } from "lucide-react";

const inputClass =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md font-body-md text-on-surface transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const selectClass =
  "h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md font-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-md font-label-md text-on-surface">
        {label} {required ? <span className="text-status-error">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="border-b border-surface-container-high pb-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-5 w-5" />
        <h2 className="text-title-lg font-title-lg">{title}</h2>
      </div>
      {subtitle ? (
        <p className="mt-2 text-body-sm font-body-sm text-on-surface-variant">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function PassengerForm({ contact, passengers, onContactChange, onPassengerChange }) {
  return (
    <div className="flex flex-col gap-stack-lg">
      <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)] sm:p-stack-lg">
        <SectionHeader
          icon={Contact}
          title="Thông tin liên hệ"
          subtitle="Vé điện tử và thay đổi lịch bay sẽ được gửi tới thông tin này."
        />
        <div className="mt-stack-md grid grid-cols-1 gap-stack-md md:grid-cols-2">
          <Field label="Email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                className={`${inputClass} pl-10`}
                name="email"
                onChange={onContactChange}
                placeholder="nguyen.van.a@example.com"
                type="email"
                value={contact.email}
              />
            </div>
          </Field>
          <Field label="Số điện thoại" required>
            <div className="flex">
              <select
                className="h-11 rounded-l-lg border border-r-0 border-outline-variant bg-surface-container px-3 text-body-md font-body-md text-on-surface-variant focus:outline-none"
                name="countryCode"
                onChange={onContactChange}
                value={contact.countryCode}
              >
                <option>+84</option>
                <option>+65</option>
                <option>+81</option>
              </select>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <input
                  className={`${inputClass} rounded-l-none pl-10`}
                  name="phone"
                  onChange={onContactChange}
                  placeholder="0901234567"
                  type="tel"
                  value={contact.phone}
                />
              </div>
            </div>
          </Field>
        </div>
      </section>

      {passengers.map((passenger, index) => (
      <section className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-[0_4px_12px_rgba(26,54,93,0.05)] sm:p-stack-lg" key={`${passenger.passengerType}-${index}`}>
        <SectionHeader icon={UserRound} title={`Hành khách ${index + 1} (${passenger.passengerType === "child" ? "Trẻ em" : "Người lớn"})`} />
        <div className="mt-stack-md grid grid-cols-1 gap-stack-md sm:grid-cols-12">
          <div className="sm:col-span-3">
            <Field label="Danh xưng" required>
              <select className={selectClass} name="title" onChange={(event) => onPassengerChange(index, event)} value={passenger.title}>
                <option>Ông</option>
                <option>Bà</option>
                <option>Cô</option>
              </select>
            </Field>
          </div>
          <div className="sm:col-span-5">
            <Field label="Họ" required>
              <input
                className={inputClass}
                name="lastName"
                onChange={(event) => onPassengerChange(index, event)}
                placeholder="VD: NGUYEN"
                type="text"
                value={passenger.lastName}
              />
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field label="Tên đệm & tên" required>
              <input
                className={inputClass}
                name="firstName"
                onChange={(event) => onPassengerChange(index, event)}
                placeholder="VD: VAN A"
                type="text"
                value={passenger.firstName}
              />
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field label="Ngày sinh" required>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <input
                  className={`${inputClass} pl-10`}
                  max={new Intl.DateTimeFormat("en-CA").format(new Date())}
                  name="birthDate"
                  onChange={(event) => onPassengerChange(index, event)}
                  type="date"
                  value={passenger.birthDate}
                />
              </div>
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field label="Quốc tịch" required>
              <select className={selectClass} name="nationality" onChange={(event) => onPassengerChange(index, event)} value={passenger.nationality}>
                <option>Việt Nam</option>
                <option>Singapore</option>
                <option>Nhật Bản</option>
                <option>Khác</option>
              </select>
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field label="Số hộ chiếu/CCCD" required>
              <input
                className={inputClass}
                name="documentNumber"
                onChange={(event) => onPassengerChange(index, event)}
                placeholder="0123456789"
                type="text"
                value={passenger.documentNumber}
              />
            </Field>
          </div>
        </div>
      </section>
      ))}
    </div>
  );
}
