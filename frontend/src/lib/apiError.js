export const getErrorMessage = (error, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.") => {
  if (Array.isArray(error?.error)) {
    return error.error.map((item) => item.message).join(", ");
  }

  return error?.error ?? error?.message ?? fallback;
};
