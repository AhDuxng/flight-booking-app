import { Luggage, Plane, RefreshCcw, TicketPercent } from "lucide-react";

export const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "Xin chào! Tôi là trợ lý ảo của VietFly. Tôi có thể giúp bạn tìm chuyến bay, kiểm tra hành lý hoặc gợi ý điểm đến cho chuyến đi sắp tới. Bạn muốn bắt đầu từ đâu?",
  time: "Bây giờ",
};

export const suggestions = [
  { label: "Tìm chuyến bay đi Đà Lạt", icon: Plane },
  { label: "Chính sách hành lý", icon: Luggage },
  { label: "Khuyến mãi hot", icon: TicketPercent },
  { label: "Đổi lịch bay", icon: RefreshCcw },
];
