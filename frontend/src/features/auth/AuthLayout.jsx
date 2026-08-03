import { Link } from "react-router-dom";
import heroBg from "@/assets/images/home/hero-bg.jpg";
import logo from "@/assets/images/logo.png";

export default function AuthLayout({ children, description, title }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-surface antialiased md:flex-row">
      <section className="relative hidden min-h-screen flex-1 overflow-hidden bg-primary-container md:flex">
        <img
          alt="Khung cảnh bầu trời nhìn từ máy bay với ánh bình minh ấm áp"
          className="absolute inset-0 h-full w-full object-cover"
          height="1080"
          src={heroBg}
          width="1600"
        />
        <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,32,69,0.85)_0%,rgba(0,32,69,0.35)_48%,rgba(0,32,69,0.86)_100%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-on-primary">
          <Link
            className="flex w-fit items-center gap-3 transition-opacity hover:opacity-85"
            to="/"
          >
            <img
              alt="VietFly Logo"
              className="h-12 w-12 object-contain"
              height="48"
              src={logo}
              width="48"
            />
            <span className="text-headline-md font-headline-md font-bold">VietFly</span>
          </Link>

          <div className="max-w-md pb-4">
            <h1 className="mb-6 text-display-lg font-display-lg leading-tight">{title}</h1>
            <p className="text-body-lg font-body-lg text-inverse-primary">{description}</p>
          </div>
        </div>
      </section>

      <main className="relative z-20 mx-auto flex min-h-screen w-full max-w-[600px] flex-1 flex-col items-center justify-center bg-surface p-6 shadow-[-12px_0_24px_rgba(0,32,69,0.05)] md:mx-0 md:max-w-none md:p-12 lg:p-24">
        <div className="w-full max-w-md">
          <Link
            className="mx-auto mb-8 flex w-fit items-center justify-center gap-2 md:hidden"
            to="/"
          >
            <img
              alt="VietFly Logo"
              className="h-10 w-10 object-contain"
              height="40"
              src={logo}
              width="40"
            />
            <span className="text-headline-md font-headline-md font-bold text-primary">
              VietFly
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
