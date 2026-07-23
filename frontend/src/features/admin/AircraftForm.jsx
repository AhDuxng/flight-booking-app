import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { useForm } from "@/hooks/useForm";

const defaultValues = {
  model: "",
  registration: "",
  seats: "",
};

export default function AircraftForm({ initialValues = defaultValues, onSubmit = () => {} }) {
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
        label="Dòng máy bay"
        name="model"
        onChange={handleChange}
        placeholder="Airbus A321neo"
        required
        value={values.model}
      />
      <Input
        label="Số đăng ký"
        name="registration"
        onChange={handleChange}
        placeholder="VN-A321"
        required
        value={values.registration}
      />
      <Input
        label="Số ghế"
        name="seats"
        onChange={handleChange}
        required
        type="number"
        value={values.seats}
      />
      <Button className="justify-self-end" type="submit" variant="admin">
        Lưu tàu bay
      </Button>
    </form>
  );
}
