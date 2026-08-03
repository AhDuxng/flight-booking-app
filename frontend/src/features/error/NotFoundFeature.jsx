import { ArrowLeft, CircleHelp, Headphones, Home, Plane, TriangleAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function FlightPath({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 190 C 50 150, 100 150, 150 100 S 200 50, 190 10"
        fill="none"
        stroke="currentColor"
        strokeDasharray="4 4"
        strokeWidth="2"
      />
    </svg>
  );
}

function MissingDestinationIllustration() {
  return (
    <div className="relative flex w-full items-center justify-center md:w-1/2">
      <div className="absolute inset-0 -z-10 flex select-none items-center justify-center">
        <span className="text-[9rem] font-black leading-none text-surface-container-highest opacity-60 sm:text-[12rem] md:text-[15rem]">
          404
        </span>
      </div>

      <div className="group relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-[0_4px_24px_rgba(26,54,93,0.08)] md:h-80 md:w-80">
        <div className="absolute inset-0 rounded-full border-4 border-primary/5" />
        <div className="absolute hidden h-1/2 w-1/2 origin-bottom-right animate-spin rounded-tl-full bg-gradient-to-tr from-primary/10 to-transparent md:block" />
        <Plane className="h-20 w-20 rotate-45 text-primary transition-transform duration-700 group-hover:-translate-y-4 group-hover:translate-x-4" />
        <CircleHelp className="absolute right-16 top-16 h-8 w-8 animate-bounce text-secondary-container" />
        <CircleHelp className="absolute bottom-20 left-16 h-5 w-5 animate-bounce text-outline" />
      </div>
    </div>
  );
}

export default function NotFoundFeature() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-container-padding py-section-gap text-on-surface antialiased">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <FlightPath className="absolute left-10 top-10 h-64 w-64 text-outline-variant opacity-20" />
        <FlightPath className="absolute bottom-10 right-10 h-96 w-96 rotate-12 text-primary-fixed opacity-30" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-section-gap md:flex-row">
        <MissingDestinationIllustration />

        <section className="flex w-full flex-col items-center gap-stack-lg text-center md:w-1/2 md:items-start md:text-left">
          <div className="space-y-stack-sm">
            <div className="mb-2 inline-flex items-center rounded-full bg-error-container px-3 py-1 font-label-md text-label-md text-on-error-container">
              <TriangleAlert className="mr-1 h-4 w-4" />
              Không tìm thấy chuyến bay
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary">
              Có vẻ chúng ta đã lỡ mất điểm nối.
            </h1>
            <p className="max-w-md font-body-lg text-body-lg text-on-surface-variant">
              Trang bạn đang tìm kiếm đã được di chuyển, bị xóa hoặc chưa từng tồn tại trong hành
              trình của VietFly.
            </p>
          </div>

          <div className="flex w-full flex-col gap-gutter-md sm:w-auto sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-secondary-container px-6 py-3 font-label-md text-label-md text-on-secondary-container shadow-sm transition-all hover:-translate-y-0.5 hover:bg-secondary-fixed-dim active:translate-y-0"
              to="/"
            >
              <Home className="mr-2 h-[18px] w-[18px]" />
              Về trang chủ
            </Link>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-primary px-6 py-3 font-label-md text-label-md text-primary transition-all hover:-translate-y-0.5 hover:bg-primary-fixed/30 active:translate-y-0"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-[18px] w-[18px]" />
              Quay lại
            </button>
          </div>

          <div className="mt-stack-md w-full border-t border-outline-variant pt-stack-md">
            <p className="flex flex-wrap items-center justify-center gap-2 font-body-sm text-body-sm text-outline md:justify-start">
              <Headphones className="h-4 w-4" />
              Cần hỗ trợ?
              <Link className="font-medium text-primary hover:underline" to="/support">
                Liên hệ chăm sóc khách hàng
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
