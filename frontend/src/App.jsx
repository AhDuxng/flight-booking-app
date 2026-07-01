import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

const HomePage = lazy(() => import("./pages/public/HomePage"));
const FlightListPage = lazy(() => import("./pages/public/FlightListPage"));
const BookingPage = lazy(() => import("./pages/user/BookingPage"));
const SeatSelectionPage = lazy(() => import("./pages/user/SeatSelectionPage"));
const PaymentPage = lazy(() => import("./pages/user/PaymentPage"));
const PaymentResultPage = lazy(() => import("./pages/user/PaymentResultPage"));
const SupportPage = lazy(() => import("./pages/public/SupportPage"));
const PromotionsPage = lazy(() => import("./pages/public/PromotionsPage"));
const MyBookingsPage = lazy(() => import("./pages/user/MyBookingsPage"));
const BookingDetailPage = lazy(() => import("./pages/user/BookingDetailPage"));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/error/NotFoundPage"));

function App() {
  return (
    <Routes>
      <Route
        path="/payment/result"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
            <PaymentResultPage />
          </Suspense>
        }
      />
      <Route
        path="/payment-result"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
            <PaymentResultPage />
          </Suspense>
        }
      />
      <Route
        path="/payment"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
            <PaymentPage />
          </Suspense>
        }
      />
      <Route
        path="/payment/:bookingId"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
            <PaymentPage />
          </Suspense>
        }
      />
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/flights"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <FlightListPage />
            </Suspense>
          }
        />
        <Route
          path="/booking/:flightId"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <BookingPage />
            </Suspense>
          }
        />
        <Route
          path="/booking/:flightId/seats"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <SeatSelectionPage />
            </Suspense>
          }
        />
        <Route
          path="/support"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <SupportPage />
            </Suspense>
          }
        />
        <Route
          path="/promotions"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <PromotionsPage />
            </Suspense>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <MyBookingsPage />
            </Suspense>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <BookingDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
              <ProfilePage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
