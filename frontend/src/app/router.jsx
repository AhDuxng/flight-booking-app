import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import Layout from '../components/Layout.jsx';
import AdminLayout from '../components/AdminLayout.jsx';

// Public Pages
import HomePage from '../pages/public/HomePage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import RegisterPage from '../pages/public/RegisterPage.jsx';
import FlightListPage from '../pages/public/FlightListPage.jsx';
import FlightDetailPage from '../pages/public/FlightDetailPage.jsx';

// User Pages
import BookingPage from '../pages/user/BookingPage.jsx';
import BookingDetailPage from '../pages/user/BookingDetailPage.jsx';
import MyBookingsPage from '../pages/user/MyBookingsPage.jsx';
import PaymentPage from '../pages/user/PaymentPage.jsx';
import PaymentResultPage from '../pages/user/PaymentResultPage.jsx';
import ProfilePage from '../pages/user/ProfilePage.jsx';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminFlightListPage from '../pages/admin/AdminFlightListPage.jsx';
import AdminFlightCreatePage from '../pages/admin/AdminFlightCreatePage.jsx';
import AdminFlightEditPage from '../pages/admin/AdminFlightEditPage.jsx';
import AdminBookingListPage from '../pages/admin/AdminBookingListPage.jsx';
import AdminAirportPage from '../pages/admin/AdminAirportPage.jsx';
import AdminAirlinePage from '../pages/admin/AdminAirlinePage.jsx';
import AdminAircraftPage from '../pages/admin/AdminAircraftPage.jsx';
import AdminPaymentListPage from '../pages/admin/AdminPaymentListPage.jsx';
import AdminUserListPage from '../pages/admin/AdminUserListPage.jsx';
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage.jsx';
import AdminReviewPage from '../pages/admin/AdminReviewPage.jsx';

// Protected Route wrapper
import { useAuth } from '../store/authStore.jsx';
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  // Public & User Routes
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '', element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'flights', element: <FlightListPage /> },
      { path: 'flights/:id', element: <FlightDetailPage /> },
      
      // User Private Routes
      { 
        path: 'profile', 
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute> 
      },
      { 
        path: 'my-bookings', 
        element: <ProtectedRoute><MyBookingsPage /></ProtectedRoute> 
      },
      { 
        path: 'booking/new', 
        element: <ProtectedRoute><BookingPage /></ProtectedRoute> 
      },
      { 
        path: 'booking/:id', 
        element: <ProtectedRoute><BookingDetailPage /></ProtectedRoute> 
      },
      { 
        path: 'payment', 
        element: <ProtectedRoute><PaymentPage /></ProtectedRoute> 
      },
      { 
        path: 'payment/result', 
        element: <ProtectedRoute><PaymentResultPage /></ProtectedRoute> 
      }
    ]
  },
  
  // Admin Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: <AdminDashboardPage /> },
      { path: 'flights', element: <AdminFlightListPage /> },
      { path: 'flights/create', element: <AdminFlightCreatePage /> },
      { path: 'flights/:id/edit', element: <AdminFlightEditPage /> },
      { path: 'bookings', element: <AdminBookingListPage /> },
      { path: 'airports', element: <AdminAirportPage /> },
      { path: 'airlines', element: <AdminAirlinePage /> },
      { path: 'aircrafts', element: <AdminAircraftPage /> },
      { path: 'payments', element: <AdminPaymentListPage /> },
      { path: 'users', element: <AdminUserListPage /> },
      { path: 'users/:id', element: <AdminUserDetailPage /> },
      { path: 'reviews', element: <AdminReviewPage /> }
    ]
  },
  
  // Error fallback
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
