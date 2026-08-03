import { useState } from "react";

export const useForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const setFieldValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const setFieldError = (field, message) => {
    setErrors((current) => ({ ...current, [field]: message }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    clearErrors,
    errors,
    handleChange,
    reset,
    setErrors,
    setFieldError,
    setFieldValue,
    setValues,
    values,
  };
};
