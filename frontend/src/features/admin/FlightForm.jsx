import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import { useForm } from "@/hooks/useForm";

const statusOptions = [
  { label: "Đã lên lịch", value: "scheduled" },
  { label: "Đang bán", value: "published" },
  { label: "Chờ duyệt", value: "pending" },
];

const airportOptions = [
  { label: "HAN - Hà Nội", value: "HAN" },
  { label: "SGN - TP. Hồ Chí Minh", value: "SGN" },
  { label: "DAD - Đà Nẵng", value: "DAD" },
  { label: "PQC - Phú Quốc", value: "PQC" },
];

export default function FlightForm({ initialValues, onSubmit, submitLabel = "Lưu chuyến bay" }) {
  const { handleChange, setFieldValue, values } = useForm(initialValues);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        <Input
          label="Mã chuyến bay"
          name="id"
          onChange={handleChange}
          placeholder="VF204"
          required
          value={values.id}
        />
        <Input
          label="Hãng bay"
          name="airline"
          onChange={handleChange}
          required
          value={values.airline}
        />
        <Input
          label="Tàu bay"
          name="aircraft"
          onChange={handleChange}
          required
          value={values.aircraft}
        />
        <FieldSelect
          label="Trạng thái"
          options={statusOptions}
          value={values.status}
          onChange={(value) => setFieldValue("status", value)}
        />
        <FieldSelect
          label="Điểm đi"
          options={airportOptions}
          value={values.origin}
          onChange={(value) => setFieldValue("origin", value)}
        />
        <FieldSelect
          label="Điểm đến"
          options={airportOptions}
          value={values.destination}
          onChange={(value) => setFieldValue("destination", value)}
        />
        <Input
          label="Ngày bay"
          name="date"
          onChange={handleChange}
          required
          type="date"
          value={values.date}
        />
        <div className="grid grid-cols-2 gap-gutter-md">
          <Input
            label="Giờ đi"
            name="departure"
            onChange={handleChange}
            required
            type="time"
            value={values.departure}
          />
          <Input
            label="Giờ đến"
            name="arrival"
            onChange={handleChange}
            required
            type="time"
            value={values.arrival}
          />
        </div>
        <Input
          label="Giá vé cơ bản"
          name="price"
          onChange={handleChange}
          required
          type="number"
          value={values.price}
        />
        <Input
          label="Số ghế mở bán"
          name="seats"
          onChange={handleChange}
          required
          type="number"
          value={values.seats}
        />
      </div>
      <div className="mt-stack-md flex justify-end">
        <Button type="submit" variant="admin">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FieldSelect({ label, options, value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-label-md font-label-md text-on-surface">{label}</span>
      <Select
        className="h-11 sm:min-w-0"
        label={label}
        options={options}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}
