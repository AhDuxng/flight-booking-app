import { Link } from "react-router-dom";
import logo from "@/assets/images/logo.png";

const footerGroups = [
  {
    title: "Khám phá",
    links: [
      { label: "Tìm chuyến bay", to: "/" },
      { label: "Khuyến mãi", to: "/promotions" },
      { label: "Đặt chỗ của tôi", to: "/my-bookings" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm hỗ trợ", to: "/support" },
      { label: "Câu hỏi thường gặp", to: "/support#faq" },
      { label: "Trợ lý VietFly AI", to: "/chatbot" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đăng nhập", to: "/login" },
      { label: "Đăng ký", to: "/register" },
      { label: "Hồ sơ của tôi", to: "/profile" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-section-gap w-full border-t border-outline-variant bg-primary dark:bg-surface-container-lowest">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-stack-lg px-container-padding py-stack-lg sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-headline-md font-headline-md font-black text-on-primary dark:text-primary"
          >
            <img
              alt="VietFly Logo"
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
              height="48"
              src={logo}
              width="48"
            />
            <span>VietFly</span>
          </Link>
          <p className="text-body-sm font-body-sm text-on-primary-container dark:text-on-surface-variant">
            © {new Date().getFullYear()} VietFly Aviation. Đồng hành trên mọi hành trình.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div className="flex flex-col gap-3" key={group.title}>
            <h2 className="text-label-md font-semibold text-on-primary dark:text-primary">
              {group.title}
            </h2>
            {group.links.map((link) => (
              <Link
                className="text-label-md text-on-primary-container transition-colors hover:text-secondary-fixed-dim dark:text-on-surface-variant dark:hover:text-secondary"
                key={link.to}
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
