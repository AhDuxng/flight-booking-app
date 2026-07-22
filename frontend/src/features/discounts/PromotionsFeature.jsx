import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Check, Copy, Plane, Sparkles, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import heroBg from "@/assets/images/home/hero-bg.jpg";
import danangImage from "@/assets/images/home/danang.jpg";
import phuquocImage from "@/assets/images/home/phuquoc.jpg";
import nhatrangImage from "@/assets/images/home/nhatrang.jpg";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { formatDateTime } from "@/features/flights/flightView";
import { getErrorMessage } from "@/lib/apiError";
import { discountService } from "./discountService";

const heroOffer = {
  badge: "Ưu đãi độc quyền",
  title: "Bay Mùa Thu, Giá Vi Vu",
  description: "Giảm ngay 20% cho tất cả các chặng bay nội địa khi đặt vé cùng VietFly.",
  code: "AUTUMN24",
  image: heroBg,
};

const promotionTemplates = [
  {
    id: "business-class",
    title: "Giảm 15% Vé Hạng Thương Gia",
    description: "Trải nghiệm dịch vụ đẳng cấp với mức giá ưu đãi khi đặt vé trước 14 ngày.",
    code: "BIZ15",
    category: "Nội địa",
    expiry: "31 Th12, 2026",
    image: danangImage,
    highlight: "Tiết kiệm 15%",
  },
  {
    id: "island-escape",
    title: "Combo Biển Đảo Cuối Tuần",
    description: "Ưu đãi đặc biệt cho các đường bay đến Phú Quốc, Nha Trang và Đà Nẵng.",
    code: "BEACH20",
    category: "Nghỉ dưỡng",
    expiry: "15 Th01, 2027",
    image: phuquocImage,
    highlight: "Giảm đến 20%",
  },
  {
    id: "family-trip",
    title: "Cả Nhà Cùng Bay",
    description: "Đặt từ 3 hành khách để nhận thêm hành lý ký gửi và ưu đãi chọn ghế.",
    code: "FAMILY",
    category: "Gia đình",
    expiry: "28 Th02, 2027",
    image: nhatrangImage,
    highlight: "Tặng hành lý",
  },
];

const benefits = [
  "Áp dụng linh hoạt cho nhiều chặng bay nội địa",
  "Nhập mã ở bước thông tin hành khách",
  "Giá trị giảm cuối cùng được máy chủ xác nhận",
];

function CopyCodeButton({ code, copiedCode, onCopy }) {
  const isCopied = copiedCode === code;

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded border px-3 font-label-md text-label-md transition-colors",
        isCopied
          ? "border-status-success bg-status-success text-on-primary"
          : "border-primary text-primary hover:bg-primary-fixed",
      )}
      onClick={() => onCopy(code)}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {isCopied ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

function HeroSection({ copiedCode, offer, onCopy }) {
  return (
    <section className="relative mb-section-gap h-[420px] w-full overflow-hidden bg-primary-container md:h-[500px]">
      <img
        alt="Máy bay VietFly bay trên tầng mây trong ánh hoàng hôn"
        className="absolute inset-0 h-full w-full object-cover"
        src={offer.image}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/55 to-primary/10" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-container-padding">
        <div className="max-w-2xl rounded-xl border border-white/30 border-l-4 border-l-secondary-container bg-surface-container-lowest/85 p-stack-lg shadow-lg backdrop-blur-xl">
          <span className="mb-stack-md inline-flex items-center gap-2 rounded bg-secondary-container px-3 py-1 font-label-md text-label-md font-bold uppercase text-on-secondary-container shadow-sm">
            <Sparkles className="h-4 w-4" />
            {offer.badge}
          </span>
          <h1 className="mb-stack-sm font-headline-lg text-headline-lg text-primary md:text-[40px] md:leading-[1.15]">
            {offer.title}
          </h1>
          <p className="mb-stack-lg font-body-lg text-body-lg text-on-surface-variant">
            {offer.description}
          </p>
          {offer.code ? <div className="mb-stack-md flex flex-col gap-stack-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center justify-between gap-4 rounded-lg border border-dashed border-outline-variant bg-primary-fixed px-4 py-3">
              <span className="font-body-sm text-body-sm uppercase text-on-primary-fixed-variant">Mã ưu đãi</span>
              <span className="font-data-mono text-data-mono font-bold text-primary">{offer.code}</span>
            </div>
            <CopyCodeButton code={offer.code} copiedCode={copiedCode} onCopy={onCopy} />
          </div> : null}
          <Link
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-secondary-container px-6 font-label-md text-label-md font-bold text-deep-navy shadow-md transition-colors hover:bg-secondary-fixed-dim sm:w-auto"
            to="/"
          >
            Tìm chuyến bay ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PromotionCard({ promotion, copiedCode, onCopy }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-slate-gray">
        <img
          alt={promotion.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={promotion.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3">
          <span className="rounded bg-status-warning/90 px-2 py-0.5 font-label-md text-[12px] font-bold text-on-secondary-container">
            {promotion.category}
          </span>
          <span className="rounded bg-surface-container-lowest/90 px-2 py-0.5 font-label-md text-[12px] font-bold text-primary backdrop-blur-sm">
            {promotion.highlight}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-stack-md">
        <h3 className="mb-1 font-title-lg text-title-lg text-primary">{promotion.title}</h3>
        <p className="mb-stack-md flex-1 font-body-sm text-body-sm text-on-surface-variant">{promotion.description}</p>
        <div className="mb-3 flex min-w-0 items-center justify-between gap-stack-sm rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-3">
          <div className="min-w-0">
            <span className="block font-body-sm text-[11px] uppercase text-on-surface-variant">
              Mã khuyến mãi
            </span>
            <span className="block truncate font-data-mono text-lg font-bold text-primary">{promotion.code}</span>
          </div>
          <CopyCodeButton code={promotion.code} copiedCode={copiedCode} onCopy={onCopy} />
        </div>
        <div className="flex items-center justify-between gap-stack-md border-t border-outline-variant pt-3">
          <span className="flex min-w-0 items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <CalendarDays className="h-4 w-4 flex-none" />
            <span className="truncate">Hết hạn {promotion.expiry}</span>
          </span>
          <Link
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-container text-secondary-container transition-colors hover:bg-primary"
            to="/"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function BenefitPanel() {
  return (
    <section className="mb-section-gap overflow-hidden rounded-xl border border-outline-variant bg-primary p-stack-lg text-on-primary shadow-sm">
      <div className="grid gap-stack-lg lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <span className="mb-stack-sm inline-flex items-center gap-2 rounded bg-secondary-container px-3 py-1 font-label-md text-label-md font-bold text-on-secondary-container">
            <Tag className="h-4 w-4" />
            Cách dùng mã
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-primary">Ưu đãi được kiểm tra trước khi tạo đặt chỗ</h2>
        </div>
        <div className="grid gap-stack-sm sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div className="rounded-lg bg-primary-container p-stack-md" key={benefit}>
              <Plane className="mb-stack-sm h-5 w-5 text-secondary-container" />
              <p className="font-body-sm text-body-sm text-primary-fixed">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PromotionsFeature() {
  const [copiedCode, setCopiedCode] = useState("");
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const response = await discountService.getActive();
      setPromotions((response.data ?? []).map((discount, index) => {
        const template = promotionTemplates[index % promotionTemplates.length];
        const discountText = discount.discount_type === "percentage" ? `Giảm ${Number(discount.discount_value)}%` : `Giảm ${new Intl.NumberFormat("vi-VN").format(Number(discount.discount_value))}đ`;
        return { ...template, id: discount.id, code: discount.code, title: discount.description || discountText, description: `Áp dụng cho ${discount.applicable_to === "all" ? "toàn bộ đơn hàng đủ điều kiện" : discount.applicable_to}. Đơn tối thiểu ${new Intl.NumberFormat("vi-VN").format(Number(discount.min_order_value || 0))}đ.`, expiry: formatDateTime(discount.end_date), highlight: discountText };
      }));
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải khuyến mãi."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCopy = async (code) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
    } catch {
      setCopiedCode("");
    }

    setCopiedCode(code);
  };

  const offer = promotions[0] ? { ...heroOffer, ...promotions[0], badge: "Ưu đãi đang hoạt động", image: heroBg } : { ...heroOffer, code: "", title: "Ưu đãi VietFly", description: "Các chương trình hợp lệ sẽ được cập nhật trực tiếp từ hệ thống." };

  return (
    <div className="flex-grow bg-surface">
      <HeroSection copiedCode={copiedCode} offer={offer} onCopy={handleCopy} />
      <div className="mx-auto max-w-7xl px-container-padding">
        <section className="mb-section-gap">
          <div className="mb-stack-lg flex min-w-0 flex-col gap-stack-sm md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 className="font-headline-lg text-headline-lg text-primary">Khuyến mãi hiện tại</h2>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Lưu ngay các mã ưu đãi hấp dẫn nhất từ VietFly
              </p>
            </div>
          </div>
          {isLoading ? <Loading label="Đang tải khuyến mãi" /> : error ? <ErrorMessage message={error} onRetry={loadPromotions} /> : promotions.length ? <div className="grid grid-cols-1 gap-gutter-md md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promotion) => (
              <PromotionCard
                copiedCode={copiedCode}
                key={promotion.id}
                promotion={promotion}
                onCopy={handleCopy}
              />
            ))}
          </div> : <EmptyState description="Hiện chưa có mã giảm giá còn hiệu lực. Hãy quay lại sau." icon={Tag} title="Chưa có khuyến mãi" />}
        </section>
        <BenefitPanel />
      </div>
    </div>
  );
}
