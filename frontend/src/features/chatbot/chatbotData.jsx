import { Luggage, Plane, RefreshCcw, TicketPercent } from "lucide-react";
import phuQuocImage from "@/assets/images/home/phuquoc.jpg";
import resortImage from "@/assets/images/home/nhatrang.jpg";

export const welcomeMessage = {
  id: "welcome",
  role: "assistant",
  text: "Xin chào! Tôi là trợ lý ảo của VietFly. Tôi có thể giúp bạn tìm chuyến bay, kiểm tra hành lý hoặc gợi ý điểm đến cho chuyến đi sắp tới. Bạn muốn bắt đầu từ đâu?",
  time: "Bây giờ",
};

export const showcaseMessages = [
  welcomeMessage,
  {
    id: "showcase-user",
    role: "user",
    text: "Gợi ý cho tôi một số tour du lịch tại Phú Quốc trong tuần tới với giá tốt nhất.",
    time: "09:16",
  },
  {
    id: "showcase-assistant",
    role: "assistant",
    text: "Phú Quốc đang vào mùa đẹp. Tôi đã chọn hai gợi ý có lịch trình gọn và mức giá tốt để bạn tham khảo:",
    time: "09:17",
    recommendations: true,
  },
];

export const conversations = [
  {
    id: "dalat",
    title: "Tìm vé đi Đà Lạt tháng 12",
    time: "2 giờ trước",
    messages: [
      welcomeMessage,
      {
        id: "dalat-user",
        role: "user",
        text: "Tìm giúp tôi vé đi Đà Lạt trong tháng 12.",
        time: "10:30",
      },
      {
        id: "dalat-assistant",
        role: "assistant",
        text: "Tôi có thể giúp ngay. Bạn cho tôi biết điểm khởi hành, ngày dự kiến và số hành khách để lọc chuyến phù hợp nhất nhé.",
        time: "10:30",
      },
    ],
  },
  {
    id: "baggage",
    title: "Hỗ trợ hành lý quá khổ",
    time: "Đang diễn ra",
    messages: [
      welcomeMessage,
      {
        id: "baggage-user",
        role: "user",
        text: "Tôi cần mang theo một bộ dụng cụ thể thao quá khổ.",
        time: "09:15",
      },
      {
        id: "baggage-assistant",
        role: "assistant",
        text: "Hành lý thể thao cần được đăng ký trước chuyến bay. Bạn nên cung cấp kích thước, khối lượng và mã đặt chỗ để VietFly kiểm tra khoang chứa cũng như mức phí chính xác.",
        time: "09:15",
      },
    ],
  },
  {
    id: "phuquoc",
    title: "Khám phá tour Phú Quốc",
    time: "Hôm qua",
    messages: showcaseMessages,
  },
];

export const suggestions = [
  { label: "Tìm chuyến bay đi Đà Lạt", icon: Plane },
  { label: "Chính sách hành lý", icon: Luggage },
  { label: "Khuyến mãi hot", icon: TicketPercent },
  { label: "Đổi lịch bay", icon: RefreshCcw },
];

export const recommendationItems = [
  {
    title: "Khám phá Nam Đảo & lặn ngắm san hô",
    description: "Tour 3 ngày 2 đêm, khách sạn 4 sao và đưa đón sân bay.",
    price: "3.250.000",
    oldPrice: "4.500.000",
    image: phuQuocImage,
    badge: "Ưu đãi nổi bật",
  },
  {
    title: "Nghỉ dưỡng và vui chơi Hòn Thơm",
    description: "Trải nghiệm cáp treo vượt biển và công viên nước.",
    price: "1.890.000",
    image: resortImage,
  },
];
