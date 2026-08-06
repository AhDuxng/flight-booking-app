import { normalizeVietnameseText } from './chatbot.flight-context.js';

export const isGeminiCredentialFailure = (status, body) => {
  const reason = `${body?.error?.status ?? ''} ${body?.error?.message ?? ''}`.toLowerCase();
  return (
    [400, 401, 403].includes(status) &&
    /(api key|api_key_invalid|credential|permission denied|unauthenticated)/i.test(reason)
  );
};

export const buildChatbotFallback = (message, flightContext) => {
  const normalized = normalizeVietnameseText(message);
  const metadata = flightContext?.metadata;

  if (metadata?.flightCount > 0) {
    const route = [metadata.origin, metadata.destination].filter(Boolean).join(' → ');
    return `Mình đã nhận diện yêu cầu tìm chuyến${route ? ` ${route}` : ''}${metadata.departureDate ? ` ngày ${metadata.departureDate}` : ''}. Phần trả lời AI đang tạm gián đoạn; bạn có thể mở mục Chuyến bay để xem ${metadata.flightCount} kết quả đang có trên hệ thống.`;
  }
  if (metadata && metadata.flightCount === 0) {
    return 'Hiện chưa tìm thấy chuyến bay phù hợp với chặng và ngày bạn yêu cầu. Bạn hãy thử đổi ngày bay hoặc kiểm tra lại điểm đi, điểm đến.';
  }
  if (/hanh ly|ky gui|xach tay/.test(normalized)) {
    return 'Hạn mức hành lý phụ thuộc hạng giá đã chọn. Bạn có thể xem ngay trong phần Hạng giá khi đặt vé; hành lý mua thêm được hiển thị trước bước chọn ghế.';
  }
  if (/doi chuyen|doi ve|huy ve|hoan tien|hoan ve/.test(normalized)) {
    return 'Bạn mở “Đặt chỗ của tôi”, chọn booking cần xử lý rồi xem báo giá đổi chuyến hoặc hủy vé. Hệ thống sẽ hiển thị phí và số tiền hoàn trước khi bạn xác nhận.';
  }
  if (/khuyen mai|ma giam gia|voucher|coupon/.test(normalized)) {
    return 'Bạn có thể xem mã còn hiệu lực tại trang “Khuyến mãi” và nhập mã trong bước thông tin hành khách. Số tiền giảm sẽ được hiển thị trước khi chọn ghế.';
  }
  if (/thanh toan|vnpay|ngan hang/.test(normalized)) {
    return 'Bạn có thể tiếp tục thanh toán từ booking đang chờ trong “Đặt chỗ của tôi”. Nếu giao dịch bị gián đoạn, hãy mở lại booking và tạo lại phiên thanh toán còn hiệu lực.';
  }
  if (/ho tro|lien he|khieu nai/.test(normalized)) {
    return 'Bạn hãy mở mục “Hỗ trợ” để gửi yêu cầu kèm mã đặt chỗ và mô tả cụ thể. Nhân viên VietFly sẽ phản hồi trong cùng yêu cầu hỗ trợ.';
  }

  return 'Trợ lý thông minh đang tạm gián đoạn. Các chức năng tìm chuyến, đặt vé, thanh toán và hỗ trợ vẫn hoạt động bình thường; bạn vui lòng thử gửi lại câu hỏi sau ít phút.';
};
