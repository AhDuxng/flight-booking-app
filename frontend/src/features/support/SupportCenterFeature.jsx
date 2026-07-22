import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CreditCard,
  FilePenLine,
  Headphones,
  Luggage,
  Mail,
  MessageCircle,
  Phone,
  PlaneTakeoff,
  Search,
  TicketCheck,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const helpTopics = [
  {
    title: "Đặt vé & vé điện tử",
    description: "Quản lý đặt chỗ, chọn ghế, xem vé và cập nhật thông tin hành khách.",
    icon: TicketCheck,
  },
  {
    title: "Hành lý",
    description: "Tra cứu hạn mức, mua thêm hành lý và xử lý thất lạc hành lý.",
    icon: Luggage,
  },
  {
    title: "Đổi chuyến & hoàn tiền",
    description: "Thay đổi ngày bay, hủy vé và theo dõi trạng thái hoàn tiền.",
    icon: Undo2,
  },
  {
    title: "Thanh toán",
    description: "Phương thức thanh toán, hóa đơn, tiền tệ và lỗi giao dịch.",
    icon: CreditCard,
  },
];

const faqs = [
  {
    question: "Tôi đổi ngày bay như thế nào?",
    answer:
      "Hiện tại bạn có thể hủy đặt chỗ đủ điều kiện trong mục Đặt chỗ của tôi. Để đổi ngày bay, hãy gửi yêu cầu cho bộ phận hỗ trợ để được báo phí và chênh lệch giá trước khi xác nhận.",
  },
  {
    question: "Hạn mức hành lý xách tay là bao nhiêu?",
    answer:
      "Hành khách phổ thông được mang 1 kiện hành lý xách tay tối đa 7kg và 1 vật dụng cá nhân nhỏ. Hạng thương gia có thể có hạn mức cao hơn tùy chuyến.",
  },
  {
    question: "Tôi nên đến sân bay trước bao lâu?",
    answer:
      "VietFly khuyến nghị có mặt trước giờ khởi hành ít nhất 2 tiếng với chuyến nội địa và 3 tiếng với chuyến quốc tế để đủ thời gian làm thủ tục.",
  },
  {
    question: "Tôi có thể yêu cầu suất ăn đặc biệt không?",
    answer:
      "Có. Bạn có thể chọn suất ăn cho từng hành khách trong quá trình đặt vé. Nếu booking đã tạo, hãy liên hệ hỗ trợ để kiểm tra khả năng bổ sung trước giờ bay.",
  },
];

const quickActions = [
  { label: "Kiểm tra mã đặt chỗ", to: "/my-bookings" },
  { label: "Thay đổi chuyến bay", search: "đổi ngày bay" },
  { label: "Mua thêm hành lý", search: "hành lý" },
  { label: "Yêu cầu hóa đơn", href: "mailto:support@vietfly.com?subject=Yêu cầu hóa đơn VietFly" },
];

export default function SupportCenterFeature() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const filteredFaqs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return faqs;
    }

    return faqs.filter((item) => {
      return `${item.question} ${item.answer}`.toLowerCase().includes(normalizedSearch);
    });
  }, [searchTerm]);

  const handleToggleFaq = (index) => {
    setOpenFaqIndex((current) => {
      if (current === index) {
        return -1;
      }

      return index;
    });
  };

  const openHelpSearch = (value) => {
    setSearchTerm(value);
    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-surface text-on-surface">
      <section className="relative overflow-hidden bg-primary bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:24px_24px] px-container-padding py-section-gap text-on-primary">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-stack-md flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed/15 text-secondary-fixed">
            <Headphones className="h-7 w-7" />
          </div>
          <h1 className="text-display-lg-mobile font-display-lg-mobile sm:text-display-lg sm:font-display-lg">
            Trung tâm hỗ trợ
          </h1>
          <p className="mx-auto mt-stack-md max-w-2xl text-body-lg font-body-lg text-primary-fixed-dim">
            Tìm câu trả lời nhanh về đặt vé, hành lý, đổi chuyến, thanh toán và các yêu cầu sau chuyến bay.
          </p>
          <div className="group relative mx-auto mt-stack-lg max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" />
            <input
              className="block h-14 w-full rounded-xl border-0 bg-surface-container-lowest pl-12 pr-4 text-body-lg font-body-lg text-on-surface shadow-lg placeholder:text-outline-variant focus:outline-none focus:ring-4 focus:ring-primary-fixed/40"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm kiếm: hành lý, đổi vé, hoàn tiền..."
              type="search"
              value={searchTerm}
            />
          </div>
          <div className="mt-stack-md flex flex-wrap justify-center gap-stack-sm">
            {quickActions.map((action) => (
              <button
                className="rounded-full border border-primary-fixed/30 bg-primary-container/70 px-4 py-2 text-body-sm font-body-sm text-primary-fixed transition-colors hover:bg-primary-container"
                key={action.label}
                onClick={() => action.to ? navigate(action.to) : action.href ? window.location.assign(action.href) : openHelpSearch(action.search)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-container-padding py-section-gap">
        <div className="mb-stack-lg text-center">
          <p className="text-label-md font-label-md text-secondary">Chủ đề phổ biến</p>
          <h2 className="mt-base text-headline-lg font-headline-lg text-primary">Bạn cần hỗ trợ phần nào?</h2>
        </div>
        <div className="grid grid-cols-1 gap-gutter-md md:grid-cols-2 lg:grid-cols-4">
          {helpTopics.map((topic) => (
            <button
              className="group flex min-h-56 flex-col items-center rounded-xl border border-surface-variant bg-surface-container-lowest p-stack-md text-center shadow-[0_4px_12px_rgba(26,54,93,0.04)] transition-all hover:-translate-y-1 hover:border-primary-fixed-dim hover:shadow-md"
              key={topic.title}
              onClick={() => openHelpSearch(topic.title)}
              type="button"
            >
              <div className="mb-stack-sm flex h-16 w-16 items-center justify-center rounded-full bg-sky-blue text-primary transition-transform group-hover:scale-105">
                <topic.icon className="h-8 w-8" />
              </div>
              <h3 className="mb-base text-title-lg font-title-lg text-primary">{topic.title}</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant">{topic.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="scroll-mt-24 bg-surface-container-low px-container-padding py-section-gap" id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="mb-stack-lg text-center">
            <h2 className="mb-base text-headline-lg font-headline-lg text-primary">Câu hỏi thường gặp</h2>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Các câu trả lời ngắn cho những tình huống hành khách gặp nhiều nhất.
            </p>
          </div>
          <div className="space-y-stack-sm">
            {filteredFaqs.map((item, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <div
                  className="overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest"
                  key={item.question}
                >
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-stack-md text-left transition-colors hover:bg-surface-container focus:bg-surface-container focus:outline-none"
                    onClick={() => handleToggleFaq(index)}
                    type="button"
                  >
                    <span className="text-title-lg font-title-lg text-primary">{item.question}</span>
                    <ChevronDown
                      className={cn("h-5 w-5 shrink-0 text-outline-variant transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="px-stack-md pb-stack-md pt-base text-body-md font-body-md text-on-surface-variant">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredFaqs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
                <p className="text-title-lg font-title-lg text-primary">Chưa tìm thấy câu hỏi phù hợp</p>
                <p className="mt-base text-body-md font-body-md text-on-surface-variant">
                  Hãy thử từ khóa khác hoặc gửi yêu cầu để đội hỗ trợ kiểm tra chi tiết.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-container-padding py-section-gap">
        <div className="overflow-hidden rounded-xl bg-primary-container p-stack-lg shadow-sm">
          <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-stack-sm flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                <PlaneTakeoff className="h-6 w-6" />
              </div>
              <h2 className="text-headline-lg font-headline-lg text-on-primary">Vẫn cần hỗ trợ?</h2>
              <p className="mt-stack-sm max-w-2xl text-body-md font-body-md text-primary-fixed">
                Đội ngũ VietFly trực 24/7 để hỗ trợ đặt vé, thanh toán, thay đổi lịch bay và các trường hợp khẩn cấp.
              </p>
              <div className="mt-stack-md grid grid-cols-1 gap-stack-sm sm:grid-cols-2">
                <ContactLine icon={Phone} text="1900 1234" />
                <ContactLine icon={Mail} text="support@vietfly.com" />
              </div>
            </div>
            <div className="flex w-full flex-col gap-stack-sm sm:flex-row md:w-auto">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondary-container px-6 text-label-md font-label-md text-on-secondary-container shadow-sm transition-colors hover:bg-secondary-fixed"
                to="/chatbot"
              >
                <MessageCircle className="h-4 w-4" />
                Chat ngay
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-fixed/40 px-6 text-label-md font-label-md text-on-primary transition-colors hover:bg-white/10"
                href="mailto:support@vietfly.com?subject=Yêu cầu hỗ trợ VietFly"
              >
                <FilePenLine className="h-4 w-4" />
                Gửi yêu cầu
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactLine({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-base text-on-primary">
      <Icon className="h-5 w-5 text-secondary-container" />
      <span className="text-label-md font-label-md">{text}</span>
    </div>
  );
}
