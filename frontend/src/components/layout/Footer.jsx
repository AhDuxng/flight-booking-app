import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full mt-section-gap bg-primary dark:bg-surface-container-lowest border-t border-outline-variant">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-lg px-container-padding py-stack-lg max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-headline-md font-headline-md font-black text-on-primary dark:text-primary"
          >
            <img
              alt="VietFly Logo"
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
              src="/src/assets/images/logo.png"
            />
            <span>VietFly</span>
          </Link>
          <p className="text-body-sm font-body-sm text-on-primary-container dark:text-on-surface-variant">
            © 2024 VietFly Aviation. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/about-us"
            className="text-label-md font-label-md text-on-primary-container dark:text-on-surface-variant hover:text-secondary-fixed-dim dark:hover:text-secondary transition-colors"
          >
            About us
          </Link>
          <Link
            to="/destinations"
            className="text-label-md font-label-md text-on-primary-container dark:text-on-surface-variant hover:text-secondary-fixed-dim dark:hover:text-secondary transition-colors"
          >
            Destinations
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/faq"
            className="text-label-md font-label-md text-on-primary-container dark:text-on-surface-variant hover:text-secondary-fixed-dim dark:hover:text-secondary transition-colors"
          >
            FAQ
          </Link>
          <Link
            to="/contact-us"
            className="text-label-md font-label-md text-on-primary-container dark:text-on-surface-variant hover:text-secondary-fixed-dim dark:hover:text-secondary transition-colors"
          >
            Contact Us
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/privacy-policy"
            className="text-label-md font-label-md text-on-primary-container dark:text-on-surface-variant hover:text-secondary-fixed-dim dark:hover:text-secondary transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
