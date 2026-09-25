import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MakeTransaction from './pages/customer/MakeTransaction';
import Transactions from './pages/customer/Transactions';
import TransactionDetails from './pages/customer/TransactionDetails';
import Profile from './pages/customer/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FraudAlerts from './pages/admin/FraudAlerts';
import FraudTransactionDetails from './pages/admin/FraudTransactionDetails';
import CustomersList from './pages/admin/CustomersList';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminTransactions from './pages/admin/AdminTransactions';
import Analytics from './pages/admin/Analytics';

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <DashboardLayout title="Account Overview">
              <CustomerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/make-transaction"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <DashboardLayout title="Make Transaction">
              <MakeTransaction />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <DashboardLayout title="Transaction History">
              <Transactions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <DashboardLayout title="Transaction Details">
              <TransactionDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared Profile & Security Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout title="Profile & Security">
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Sentinel Fraud Monitoring">
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fraud-alerts"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Fraud Alerts Queue">
              <FraudAlerts />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fraud-alerts/:transactionId"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Alert Forensic Details">
              <FraudTransactionDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Customer Transactions Ledger">
              <AdminTransactions />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Customer Directory">
              <CustomersList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Accounts & Liquidity">
              <AdminAccounts />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout title="Risk Analytics">
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root & Fallback */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
