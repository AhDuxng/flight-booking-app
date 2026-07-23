import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { useForm } from "@/hooks/useForm";

const defaultValues = {
  code: "",
  name: "",
  type: "Full-service",
};

export default function AirlineForm({ initialValues = defaultValues, onSubmit = () => {} }) {
  const { handleChange, values } = useForm(initialValues);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="grid gap-stack-md rounded-lg border border-surface-container-high bg-surface-container-lowest p-stack-md shadow-sm" onSubmit={handleSubmit}>
      <Input label="Mã hãng" name="code" onChange={handleChange} placeholder="VF" required value={values.code} />
      <Input label="Tên hãng" name="name" onChange={handleChange} placeholder="VietFly Airlines" required value={values.name} />
      <Input label="Loại hình" name="type" onChange={handleChange} placeholder="Full-service" required value={values.type} />
      <Button className="justify-self-end" type="submit" variant="admin">
        Lưu hãng bay
      </Button>
    </form>
  );
}
