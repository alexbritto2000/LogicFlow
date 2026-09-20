import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// We will implement full feature views in upcoming phases
const DashboardPage = React.lazy(() => import('../pages/dashboard/Dashboard'));
const CustomersPage = React.lazy(() => import('../pages/customers/CustomersPage'));
const VehiclesPage = React.lazy(() => import('../pages/vehicles/VehiclesPage'));
const DriversPage = React.lazy(() => import('../pages/drivers/DriversPage'));
const DocumentsPage = React.lazy(() => import('../pages/documents/DocumentsPage'));
const BookingsPage = React.lazy(() => import('../pages/bookings/BookingsPage'));
const ShipmentsPage = React.lazy(() => import('../pages/shipments/ShipmentsPage'));
const TrackingPage = React.lazy(() => import('../pages/tracking/TrackingPage'));
const AssignmentsPage = React.lazy(() => import('../pages/assignments/AssignmentsPage'));
const DeliveryPage = React.lazy(() => import('../pages/delivery/DeliveryPage'));
const InvoicesPage = React.lazy(() => import('../pages/invoices/InvoicesPage'));
const PaymentsPage = React.lazy(() => import('../pages/payments/PaymentsPage'));
const ExpensesPage = React.lazy(() => import('../pages/expenses/ExpensesPage'));
const ReportsPage = React.lazy(() => import('../pages/reports/ReportsPage'));
const UsersPage = React.lazy(() => import('../pages/users/UsersPage'));
const DemoVideoStudioPage = React.lazy(() => import('../pages/demo/DemoVideoStudioPage'));

export const AppRoutes: React.FC = () => {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-teal-600">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/demo-video" element={<DemoVideoStudioPage />} />

        {/* Protected Dashboard Layout Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Operations']}>
                <CustomersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Dispatcher']}>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/drivers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Dispatcher']}>
                <DriversPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Dispatcher']}>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Operations']}>
                <BookingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shipments"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Operations', 'Dispatcher', 'Driver']}>
                <ShipmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Dispatcher']}>
                <AssignmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Dispatcher', 'Driver']}>
                <DeliveryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Accountant']}>
                <InvoicesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Accountant']}>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Accountant']}>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Accountant', 'Operations']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route path="/demo-studio" element={<DemoVideoStudioPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Suspense>
  );
};
