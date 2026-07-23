import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { useForm } from "@/hooks/useForm";

const defaultValues = {
  city: "",
  code: "",
  name: "",
  terminal: "",
};

export default function AirportForm({ initialValues = defaultValues, onSubmit = () => {} }) {
  const { handleChange, values } = useForm(initialValues);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      className="grid gap-stack-md rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm"
      onSubmit={handleSubmit}
    >
      <Input
        label="Mã sân bay"
        name="code"
        onChange={handleChange}
        placeholder="HAN"
        required
        value={values.code}
      />
      <Input
        label="Tên sân bay"
        name="name"
        onChange={handleChange}
        placeholder="Nội Bài"
        required
        value={values.name}
      />
      <Input
        label="Thành phố"
        name="city"
        onChange={handleChange}
        placeholder="Hà Nội"
        required
        value={values.city}
      />
      <Input
        label="Nhà ga"
        name="terminal"
        onChange={handleChange}
        placeholder="T1, T2"
        value={values.terminal}
      />
      <Button className="justify-self-end" type="submit" variant="admin">
        Lưu sân bay
      </Button>
    </form>
  );
}
