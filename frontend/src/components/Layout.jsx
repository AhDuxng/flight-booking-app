import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
