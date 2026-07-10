export const buildResponse = (value) => {
  const question = value.toLocaleLowerCase("vi-VN");

  if (question.includes("hành lý")) {
    return "Hành khách hạng phổ thông được mang 1 kiện xách tay tối đa 7 kg. Hành lý ký gửi hoặc hành lý quá khổ nên được mua và đăng ký trước giờ bay để có mức phí tốt hơn. Bạn có thể gửi mã đặt chỗ để tôi hướng dẫn tiếp.";
  }

  if (question.includes("đổi") || question.includes("hoàn")) {
    return "Bạn có thể đổi lịch trong mục Đặt chỗ của tôi. Phí đổi và chênh lệch giá sẽ phụ thuộc điều kiện vé; hệ thống luôn hiển thị tổng phí trước khi bạn xác nhận.";
  }

  if (question.includes("khuyến mãi") || question.includes("giá tốt")) {
    return "VietFly đang có ưu đãi cho các chặng Đà Nẵng, Phú Quốc và Nha Trang. Bạn mở trang Khuyến mãi để xem thời gian áp dụng và mã giảm giá phù hợp.";
  }

  if (question.includes("chuyến bay") || question.includes("vé") || question.includes("đà lạt")) {
    return "Tôi sẵn sàng tìm chuyến bay. Hãy cho tôi điểm đi, điểm đến, ngày bay và số hành khách; ví dụ: “TP.HCM đi Đà Lạt ngày 18/12 cho 2 người”.";
  }

  return "Tôi đã ghi nhận yêu cầu. Bạn có thể bổ sung mã đặt chỗ, chặng bay hoặc ngày khởi hành để tôi đưa ra hướng dẫn chính xác hơn. Với thay đổi quan trọng, VietFly sẽ luôn yêu cầu bạn xác nhận trước khi thực hiện.";
};
