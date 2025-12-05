// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Admin
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AuditLogsPage from "./pages/admin/AuditLogsPage.jsx";
import IntegrationsPage from "./pages/admin/IntegrationsPage.jsx";

// Finance
import FinanceDashboardPage from "./pages/finance/FinanceDashboardPage.jsx";
import AccountsPage from "./pages/finance/AccountsPage.jsx";
import JournalEntriesPage from "./pages/finance/JournalEntriesPage.jsx";
import StatementsPage from "./pages/finance/StatementsPage.jsx";
import InvoicesPage from "./pages/finance/InvoicesPage.jsx";
import InvoiceFormPage from "./pages/finance/InvoiceFormPage.jsx";
import PaymentsPage from "./pages/finance/PaymentsPage.jsx";
import CustomersPage from "./pages/finance/CustomersPage.jsx";
import VendorsPage from "./pages/finance/VendorsPage.jsx";

// Projects
import ProjectsPage from "./pages/projects/ProjectsPage.jsx";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage.jsx";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16 px-4 sm:px-8 max-w-7xl mx-auto flex gap-4">
        <Sidebar />
        <main className="flex-1 py-4">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
    <Navbar />
    
    <Routes>
      {/* PUBLIC ROUTES (no ProtectedRoute, no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* PROTECTED ROUTES WITH LAYOUT */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AdminUsersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AuditLogsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/integrations"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <IntegrationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Finance */}
      <Route
        path="/finance"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <FinanceDashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/accounts"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <AccountsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/journals"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <JournalEntriesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/statements"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <StatementsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/invoices"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <InvoicesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/invoices/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <InvoiceFormPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/payments"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <PaymentsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/customers"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <CustomersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/vendors"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance_manager"]}>
            <AppLayout>
              <VendorsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Projects */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute allowedRoles={["admin", "project_manager"]}>
            <AppLayout>
              <ProjectsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/projects/:id"
        element{
          <ProtectedRoute allowedRoles={["admin", "project_manager"]}>
            <AppLayout>
              <ProjectDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      /> */}

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
