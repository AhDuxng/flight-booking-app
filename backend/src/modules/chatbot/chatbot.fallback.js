import { normalizeVietnameseText } from './chatbot.flight-context.js';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));

const formatDeparture = (value) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
  }).format(new Date(value));

const formatEndDate = (value) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
  }).format(new Date(value));

const buildFlightFallback = (metadata) => {
  if (metadata.unavailable) {
    return 'Mình chưa thể truy xuất dữ liệu chuyến bay lúc này. Bạn vui lòng thử lại sau ít phút.';
  }

  if (metadata.flightCount === 0) {
    const route = [metadata.origin, metadata.destination].filter(Boolean).join(' → ');
    const criteria = [route, metadata.departureLabel].filter(Boolean).join(', ');
    return `Hiện chưa tìm thấy chuyến bay${criteria ? ` phù hợp với ${criteria}` : ' phù hợp'}. Bạn hãy thử đổi ngày bay hoặc chặng bay.`;
  }

  const shownFlights = (metadata.flights ?? []).slice(0, 6);
  const flightLines = shownFlights.map(
    (flight, index) =>
      `${index + 1}. ${flight.flightNumber} · ${flight.origin} → ${flight.destination} · ${formatDeparture(flight.departureTime)} · từ ${formatCurrency(flight.price)} · còn ${flight.availableSeats} ghế · /flights/${flight.id}`,
  );
  const remaining = metadata.flightCount - shownFlights.length;

  return [
    `Mình tìm thấy ${metadata.flightCount} chuyến${metadata.departureLabel ? ` trong ${metadata.departureLabel}` : ''}:`,
    ...flightLines,
    remaining > 0
      ? `Còn ${remaining} chuyến khác. Bạn có thể cung cấp điểm đi hoặc giờ mong muốn để lọc thêm.`
      : null,
  ]
    .filter(Boolean)
    .join('\n');
};

const buildPromotionFallback = (metadata) => {
  if (metadata.unavailable) {
    return 'Mình chưa thể truy xuất danh sách khuyến mãi lúc này. Bạn vui lòng mở trang “Khuyến mãi” hoặc thử lại sau.';
  }

  if (!metadata.discounts?.length) {
    return 'Hiện chưa có mã giảm giá vé máy bay còn hiệu lực và còn lượt sử dụng.';
  }

  return [
    'Các mã khuyến mãi đang có:',
    ...metadata.discounts.map(
      (discount, index) =>
        `${index + 1}. ${discount.code} · giảm ${discount.value} · đơn tối thiểu ${discount.minimumOrder.toLocaleString('vi-VN')}đ · hạn ${formatEndDate(discount.endDate)}`,
    ),
    'Khi chọn chuyến, hệ thống sẽ chỉ hiển thị mã đáp ứng đủ điều kiện và bạn chỉ được áp dụng một mã.',
  ].join('\n');
};

export const isGeminiCredentialFailure = (status, body) => {
  const reason = `${body?.error?.status ?? ''} ${body?.error?.message ?? ''}`.toLowerCase();
  return (
    [400, 401, 403].includes(status) &&
    /(api key|api_key_invalid|credential|permission denied|unauthenticated)/i.test(reason)
  );
};

export const buildChatbotFallback = (message, realtimeContext) => {
  const normalized = normalizeVietnameseText(message);
  const metadata = realtimeContext?.metadata;

  if (metadata?.intent === 'promotion') return buildPromotionFallback(metadata);
  if (metadata?.intent === 'flight') return buildFlightFallback(metadata);
  if (/hanh ly|ky gui|xach tay/.test(normalized)) {
    return 'Hạn mức hành lý phụ thuộc hạng giá đã chọn. Bạn có thể xem ngay trong phần Hạng giá khi đặt vé; hành lý mua thêm được hiển thị trước bước chọn ghế.';
  }
  if (/doi chuyen|doi ve|huy ve|hoan tien|hoan ve/.test(normalized)) {
    return 'Bạn mở “Đặt chỗ của tôi”, chọn booking cần xử lý rồi xem báo giá đổi chuyến hoặc hủy vé. Hệ thống sẽ hiển thị phí và số tiền hoàn trước khi bạn xác nhận.';
  }
  if (/khuyen mai|ma giam gia|voucher|coupon/.test(normalized)) {
    return 'Bạn có thể xem mã còn hiệu lực tại trang “Khuyến mãi”. Khi đặt vé, hệ thống sẽ chỉ hiển thị các mã phù hợp và tính số tiền giảm trước bước chọn ghế.';
  }
  if (/thanh toan|vnpay|ngan hang/.test(normalized)) {
    return 'Bạn có thể tiếp tục thanh toán từ booking đang chờ trong “Đặt chỗ của tôi”. Nếu giao dịch bị gián đoạn, hãy mở lại booking và tạo lại phiên thanh toán còn hiệu lực.';
  }
  if (/ho tro|lien he|khieu nai/.test(normalized)) {
    return 'Bạn hãy mở mục “Hỗ trợ” để gửi yêu cầu kèm mã đặt chỗ và mô tả cụ thể. Nhân viên VietFly sẽ phản hồi trong cùng yêu cầu hỗ trợ.';
  }

  return 'Trợ lý thông minh đang tạm gián đoạn. Các chức năng tìm chuyến, đặt vé, thanh toán và hỗ trợ vẫn hoạt động bình thường; bạn vui lòng thử gửi lại câu hỏi sau ít phút.';
};
