export const getErrorMessage = (error, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.") => {
  if (Array.isArray(error?.error)) {
    return error.error.map((item) => item.message).join(", ");
  }

  return error?.error ?? error?.message ?? fallback;
};

const bookingErrorMessages = {
  BOOKING_INPUT_INVALID: "Thông tin hành khách hoặc dịch vụ đi kèm chưa hợp lệ.",
  DISCOUNT_NOT_ELIGIBLE: "Mã giảm giá không còn đủ điều kiện áp dụng.",
  FARE_NOT_AVAILABLE: "Hạng giá không phù hợp với ghế đã chọn.",
  FLIGHT_NOT_SELLABLE: "Chuyến bay này hiện không còn mở bán.",
  IDEMPOTENCY_CONFLICT: "Yêu cầu đặt chỗ đã thay đổi. Vui lòng thử lại.",
  INSUFFICIENT_SEATS: "Chuyến bay không còn đủ số ghế yêu cầu.",
  SEAT_NOT_AVAILABLE: "Một hoặc nhiều ghế vừa được người khác chọn. Vui lòng chọn ghế khác.",
};

export const getBookingErrorMessage = (error) => {
  if (bookingErrorMessages[error?.code]) {
    return bookingErrorMessages[error.code];
  }
  const message = getErrorMessage(error, "Không thể tạo đặt chỗ.");
  if (message === "Internal server error") {
    return `Không thể tạo đặt chỗ do lỗi hệ thống${error?.requestId ? ` (mã lỗi ${error.requestId})` : ""}. Vui lòng thử lại.`;
  }
  return message;
};
