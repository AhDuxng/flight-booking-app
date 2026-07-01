import { Outlet } from "react-router-dom";
import TopNavBar from "./TopNavBar";
import Footer from "./Footer";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body-md antialiased pt-16">
      <TopNavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
