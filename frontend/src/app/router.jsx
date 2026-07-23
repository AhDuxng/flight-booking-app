import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import Loading from "@/components/common/Loading";
import AdminRoute from "@/components/common/AdminRoute";
import PrivateRoute from "@/components/common/PrivateRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import MainLayout from "@/components/layout/MainLayout";

const HomePage = lazy(() => import("@/pages/public/HomePage"));
const FlightListPage = lazy(() => import("@/pages/public/FlightListPage"));
const FlightDetailPage = lazy(() => import("@/pages/public/FlightDetailPage"));
const LoginPage = lazy(() => import("@/pages/public/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/public/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/public/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/public/ResetPasswordPage"));
const OAuthCallbackPage = lazy(() => import("@/pages/public/OAuthCallbackPage"));
const SupportPage = lazy(() => import("@/pages/public/SupportPage"));
const PromotionsPage = lazy(() => import("@/pages/public/PromotionsPage"));
const ChatbotPage = lazy(() => import("@/pages/public/ChatbotPage"));
const BookingPage = lazy(() => import("@/pages/user/BookingPage"));
const SeatSelectionPage = lazy(() => import("@/pages/user/SeatSelectionPage"));
const PaymentPage = lazy(() => import("@/pages/user/PaymentPage"));
const PaymentResultPage = lazy(() => import("@/pages/user/PaymentResultPage"));
const MyBookingsPage = lazy(() => import("@/pages/user/MyBookingsPage"));
const BookingDetailPage = lazy(() => import("@/pages/user/BookingDetailPage"));
const ProfilePage = lazy(() => import("@/pages/user/ProfilePage"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminFlightListPage = lazy(() => import("@/pages/admin/AdminFlightListPage"));
const AdminFlightCreatePage = lazy(() => import("@/pages/admin/AdminFlightCreatePage"));
const AdminFlightEditPage = lazy(() => import("@/pages/admin/AdminFlightEditPage"));
const AdminBookingListPage = lazy(() => import("@/pages/admin/AdminBookingListPage"));
const AdminPaymentListPage = lazy(() => import("@/pages/admin/AdminPaymentListPage"));
const AdminReviewPage = lazy(() => import("@/pages/admin/AdminReviewPage"));
const AdminUserListPage = lazy(() => import("@/pages/admin/AdminUserListPage"));
const AdminUserDetailPage = lazy(() => import("@/pages/admin/AdminUserDetailPage"));
const AdminAirportPage = lazy(() => import("@/pages/admin/AdminAirportPage"));
const AdminAirlinePage = lazy(() => import("@/pages/admin/AdminAirlinePage"));
const AdminAircraftPage = lazy(() => import("@/pages/admin/AdminAircraftPage"));
const ForbiddenPage = lazy(() => import("@/pages/error/ForbiddenPage"));
const ServerErrorPage = lazy(() => import("@/pages/error/ServerErrorPage"));
const NotFoundPage = lazy(() => import("@/pages/error/NotFoundPage"));

const withSuspense = (Page) => (
  <Suspense fallback={<Loading label="Đang tải giao diện" />}>
    <Page />
  </Suspense>
);

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: withSuspense(HomePage) },
      { path: "/flights", element: withSuspense(FlightListPage) },
      { path: "/flights/:flightId", element: withSuspense(FlightDetailPage) },
      {
        path: "/booking/:flightId",
        element: <PrivateRoute>{withSuspense(BookingPage)}</PrivateRoute>,
      },
      {
        path: "/booking/:flightId/seats",
        element: <PrivateRoute>{withSuspense(SeatSelectionPage)}</PrivateRoute>,
      },
      { path: "/support", element: withSuspense(SupportPage) },
      { path: "/promotions", element: withSuspense(PromotionsPage) },
      {
        path: "/my-bookings",
        element: <PrivateRoute>{withSuspense(MyBookingsPage)}</PrivateRoute>,
      },
      {
        path: "/bookings/:bookingId",
        element: <PrivateRoute>{withSuspense(BookingDetailPage)}</PrivateRoute>,
      },
      { path: "/profile", element: <PrivateRoute>{withSuspense(ProfilePage)}</PrivateRoute> },
    ],
  },
  { path: "/login", element: withSuspense(LoginPage) },
  { path: "/register", element: withSuspense(RegisterPage) },
  { path: "/forgot-password", element: withSuspense(ForgotPasswordPage) },
  { path: "/reset-password", element: withSuspense(ResetPasswordPage) },
  { path: "/auth/callback", element: withSuspense(OAuthCallbackPage) },
  { path: "/chatbot", element: withSuspense(ChatbotPage) },
  { path: "/payment", element: <Navigate replace to="/my-bookings" /> },
  {
    path: "/payment/:bookingId",
    element: <PrivateRoute>{withSuspense(PaymentPage)}</PrivateRoute>,
  },
  {
    path: "/payment/result",
    element: <PrivateRoute>{withSuspense(PaymentResultPage)}</PrivateRoute>,
  },
  { path: "/payment-result", element: <Navigate replace to="/payment/result" /> },
  {
    path: "/my-bookings/:bookingId",
    element: <PrivateRoute>{withSuspense(BookingDetailPage)}</PrivateRoute>,
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: withSuspense(AdminDashboardPage) },
      { path: "flights", element: withSuspense(AdminFlightListPage) },
      { path: "flights/create", element: withSuspense(AdminFlightCreatePage) },
      { path: "flights/:flightId/edit", element: withSuspense(AdminFlightEditPage) },
      { path: "bookings", element: withSuspense(AdminBookingListPage) },
      { path: "payments", element: withSuspense(AdminPaymentListPage) },
      { path: "reviews", element: withSuspense(AdminReviewPage) },
      { path: "users", element: withSuspense(AdminUserListPage) },
      { path: "users/:userId", element: withSuspense(AdminUserDetailPage) },
      { path: "airports", element: withSuspense(AdminAirportPage) },
      { path: "airlines", element: withSuspense(AdminAirlinePage) },
      { path: "aircrafts", element: withSuspense(AdminAircraftPage) },
    ],
  },
  { path: "/403", element: withSuspense(ForbiddenPage) },
  { path: "/500", element: withSuspense(ServerErrorPage) },
  { path: "*", element: withSuspense(NotFoundPage) },
]);

export default router;
