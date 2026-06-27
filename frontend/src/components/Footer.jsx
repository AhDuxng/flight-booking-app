import React from 'react';
import { Plane } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Plane className="h-6 w-6 rotate-45" />
            <span className="font-extrabold text-lg text-indigo-900 tracking-wider">PHENIKAA DREAM FLIGHTS</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Phenikaa Dream Flights. Bản quyền được bảo lưu.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Liên hệ hỗ trợ</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
