// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { HelpButton } from "./components/common";
import Chat from "./components/chat/Chat.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import RequestCompanyPage from "./pages/RequestCompanyPage.jsx";
import MyCompanyRequestsPage from "./pages/MyCompanyRequestsPage.jsx";

// Admin a
import { AdminUsersPage, AuditLogsPage, IntegrationsPage, CompaniesPage, SupportTicketsPage, PlatformAnalyticsPage, CompanyRequestsPage } from "./pages/admin";

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
import { TasksPage } from "./pages/projects";

// HR
import { EmployeesPage, DepartmentsPage, AttendancePage, LeavesPage, HolidaysPage } from "./pages/hr";

// Inventory
import { ProductsPage, CategoriesPage, StockPage } from "./pages/inventory";

// Marketplace
import { MarketplacePage, CompanyProfilePage, RegisterCompanyPage, MyRequestsPage, SavedCompaniesPage } from "./pages/marketplace";

// CRM
import { LeadsPage, ContactRequestsPage, CustomersPage as CRMCustomersPage } from "./pages/crm";

// Test Pages
import SocketTestPage from "./pages/SocketTestPage.jsx";
import TeamsPage from "./pages/teams/TeamsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen theme-bg-primary">
      <Navbar />
      <div className="pt-16 px-4 sm:px-8 max-w-7xl mx-auto flex gap-4">
        <Sidebar />
        <main className="flex-1 py-4">{children}</main>
      </div>
      <HelpButton />
      <Chat />
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen theme-bg-primary">
      <Navbar />
      <main className="pt-16 px-4 sm:px-8 max-w-7xl mx-auto py-4">{children}</main>
      <HelpButton />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* MARKETPLACE - Public */}
        <Route path="/marketplace" element={<PublicLayout><MarketplacePage /></PublicLayout>} />
        <Route path="/marketplace/:slug" element={<PublicLayout><CompanyProfilePage /></PublicLayout>} />
        <Route path="/register-company" element={<ProtectedRoute><RegisterCompanyPage /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute><AppLayout><MyRequestsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><AppLayout><SavedCompaniesPage /></AppLayout></ProtectedRoute>} />

        {/* DASHBOARD */}
        <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AppLayout><AdminUsersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute requireAdmin><AppLayout><AuditLogsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/integrations" element={<ProtectedRoute requireAdmin><AppLayout><IntegrationsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute requireAdmin><AppLayout><CompaniesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute requireAdmin><AppLayout><SupportTicketsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AppLayout><PlatformAnalyticsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/admin/company-requests" element={<ProtectedRoute requireAdmin><AppLayout><CompanyRequestsPage /></AppLayout></ProtectedRoute>} />

        {/* Company Registration */}
        <Route path="/request-company" element={<ProtectedRoute><RequestCompanyPage /></ProtectedRoute>} />
        <Route path="/my-company-requests" element={<ProtectedRoute><AppLayout><MyCompanyRequestsPage /></AppLayout></ProtectedRoute>} />

        {/* HR MODULE */}
        <Route path="/hr/employees" element={<ProtectedRoute><AppLayout><EmployeesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/departments" element={<ProtectedRoute><AppLayout><DepartmentsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/attendance" element={<ProtectedRoute><AppLayout><AttendancePage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/leaves" element={<ProtectedRoute><AppLayout><LeavesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/hr/holidays" element={<ProtectedRoute><AppLayout><HolidaysPage /></AppLayout></ProtectedRoute>} />

        {/* INVENTORY MODULE */}
        <Route path="/inventory/products" element={<ProtectedRoute><AppLayout><ProductsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/inventory/categories" element={<ProtectedRoute><AppLayout><CategoriesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/inventory/stock" element={<ProtectedRoute><AppLayout><StockPage /></AppLayout></ProtectedRoute>} />

        {/* CRM MODULE */}
        <Route path="/crm/leads" element={<ProtectedRoute><AppLayout><LeadsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/requests" element={<ProtectedRoute><AppLayout><ContactRequestsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/crm/customers" element={<ProtectedRoute><AppLayout><CRMCustomersPage /></AppLayout></ProtectedRoute>} />

        {/* FINANCE MODULE */}
        <Route path="/finance" element={<ProtectedRoute><AppLayout><FinanceDashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/accounts" element={<ProtectedRoute><AppLayout><AccountsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/journals" element={<ProtectedRoute><AppLayout><JournalEntriesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/statements" element={<ProtectedRoute><AppLayout><StatementsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/invoices" element={<ProtectedRoute><AppLayout><InvoicesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/invoices/new" element={<ProtectedRoute><AppLayout><InvoiceFormPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/payments" element={<ProtectedRoute><AppLayout><PaymentsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/customers" element={<ProtectedRoute><AppLayout><CustomersPage /></AppLayout></ProtectedRoute>} />
        <Route path="/finance/vendors" element={<ProtectedRoute><AppLayout><VendorsPage /></AppLayout></ProtectedRoute>} />

        {/* PROJECTS */}
        <Route path="/projects" element={<ProtectedRoute><AppLayout><ProjectsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/projects/tasks" element={<ProtectedRoute><AppLayout><TasksPage /></AppLayout></ProtectedRoute>} />

        {/* PROFILE & SETTINGS */}
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />

        {/* TEAMS CHAT - Full screen */}
        <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

        {/* TEST PAGES */}
        <Route path="/test/socket" element={<ProtectedRoute><AppLayout><SocketTestPage /></AppLayout></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
