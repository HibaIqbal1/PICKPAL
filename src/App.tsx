import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ServicesProvider } from "./contexts/ServicesContext";
import {
  AuthGuard,
  CustomerGuard,
  WorkerGuard,
  ManagerGuard,
  AdminGuard,
  ControlGuard,
  RoleRedirect,
} from "./app/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import CustomerLayout from "./components/shared/CustomerLayout";
import CustomerHome from "./pages/customer/Home";
import CustomerOrders from "./pages/customer/Orders";
import CustomerCategories from "./pages/customer/Categories";
import CustomerProfile from "./pages/customer/Profile";
import CustomerWallet from "./pages/customer/CustomerWallet";
import Inbox from "./pages/customer/Inbox";
import NewRequest from "./pages/customer/NewRequest";
import ServiceDetails from "./pages/customer/ServiceDetails";
import Track from "./pages/customer/Track";
import ShopsBrowse from "./pages/customer/ShopsBrowse";
import ShopProfile from "./pages/customer/ShopProfile";
import AppointmentToken from "./pages/customer/AppointmentToken";
import ScrollToTop from "./components/shared/ScrollToTop";

import WorkerLayout from "./components/shared/WorkerLayout";
import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerJobs from "./pages/worker/WorkerJobs";
import WorkerPerformance from "./pages/worker/WorkerPerformance";
import WorkerServices from "./pages/worker/WorkerServices";
import WorkerEarnings from "./pages/worker/WorkerEarnings";
import WorkerAvailability from "./pages/worker/WorkerAvailability";
import WorkerInbox from "./pages/worker/WorkerInbox";
import WorkerProfile from "./pages/worker/WorkerProfile";
import WorkerJob from "./pages/worker/Job";
import WorkerOnboarding from "./pages/worker/Onboarding";
import ShopSetup from "./pages/worker/ShopSetup";
import ShopDashboard from "./pages/worker/ShopDashboard";
import ShopStaff from "./pages/worker/ShopStaff";
import ShopServices from "./pages/worker/ShopServices";

import AdminDashboard from "./pages/admin/Dashboard";

// PickPal Control Pages
import ControlLogin from "./pages/control/ControlLogin";
import ControlDashboard from "./pages/control/ControlDashboard";
import ControlWorkerApplications from "./pages/control/ControlWorkerApplications";
import ControlWorkers from "./pages/control/ControlWorkers";
import ControlCustomers from "./pages/control/ControlCustomers";
import ControlOrders from "./pages/control/ControlOrders";
import ControlShops from "./pages/control/ControlShops";
import ControlServices from "./pages/control/ControlServices";
import ControlQueue from "./pages/control/ControlQueue";
import ControlPayments from "./pages/control/ControlPayments";
import ControlComplaints from "./pages/control/ControlComplaints";
import ControlSos from "./pages/control/ControlSos";
import ControlNotifications from "./pages/control/ControlNotifications";
import ControlReports from "./pages/control/ControlReports";
import ControlLogs from "./pages/control/ControlLogs";
import ControlSettings from "./pages/control/ControlSettings";

import MobileAppView from "./pages/MobileAppView";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ServicesProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Routes>
              {/* PickPal Mobile App Studio Routes */}
              <Route path="/app" element={<MobileAppView />} />
              <Route path="/mobile" element={<MobileAppView />} />
              <Route path="/customer/login" element={<MobileAppView />} />
              <Route path="/customer/home" element={<MobileAppView />} />
              <Route path="/customer/tracking" element={<MobileAppView />} />
              <Route path="/worker/login" element={<MobileAppView />} />
              <Route path="/worker/dashboard" element={<MobileAppView />} />
              <Route path="/worker/task" element={<MobileAppView />} />
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Private Customer Routes */}
              <Route path="/customer" element={<CustomerGuard><CustomerLayout><CustomerHome /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/orders" element={<CustomerGuard><CustomerLayout><CustomerOrders /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/categories" element={<CustomerGuard><CustomerLayout><CustomerCategories /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/shops" element={<CustomerGuard><CustomerLayout><ShopsBrowse /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/shop/:shopId" element={<CustomerGuard><CustomerLayout><ShopProfile /></CustomerLayout></CustomerGuard>} />
              <Route path="/shops/:shopId" element={<CustomerGuard><CustomerLayout><ShopProfile /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/appointment/:appointmentId" element={<CustomerGuard><CustomerLayout><AppointmentToken /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/wallet" element={<CustomerGuard><CustomerLayout><CustomerWallet /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/inbox" element={<CustomerGuard><CustomerLayout><Inbox /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/profile" element={<CustomerGuard><CustomerLayout><CustomerProfile /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/service/:serviceId" element={<CustomerGuard><CustomerLayout><ServiceDetails /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/new-request" element={<CustomerGuard><CustomerLayout><NewRequest /></CustomerLayout></CustomerGuard>} />
              <Route path="/customer/track/:orderId" element={<CustomerGuard><CustomerLayout><Track /></CustomerLayout></CustomerGuard>} />

              {/* Private Worker Routes */}
              <Route path="/worker" element={<WorkerGuard><WorkerLayout><WorkerDashboard /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/jobs" element={<WorkerGuard><WorkerLayout><WorkerJobs /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/earnings" element={<WorkerGuard><WorkerLayout><WorkerEarnings /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/availability" element={<WorkerGuard><WorkerLayout><WorkerAvailability /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/inbox" element={<WorkerGuard><WorkerLayout><WorkerInbox /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/performance" element={<WorkerGuard><WorkerLayout><WorkerPerformance /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/services" element={<WorkerGuard><WorkerLayout><WorkerServices /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/shop-setup" element={<WorkerGuard><WorkerLayout><ShopSetup /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/shop-dashboard" element={<WorkerGuard><WorkerLayout><ShopDashboard /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/shop-staff" element={<WorkerGuard><WorkerLayout><ShopStaff /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/shop-services" element={<WorkerGuard><WorkerLayout><ShopServices /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/profile" element={<WorkerGuard><WorkerLayout><WorkerProfile /></WorkerLayout></WorkerGuard>} />
              <Route path="/worker/onboarding" element={<AuthGuard><WorkerOnboarding /></AuthGuard>} />
              <Route path="/worker/job/:orderId" element={<WorkerGuard><WorkerLayout><WorkerJob /></WorkerLayout></WorkerGuard>} />

              {/* Legacy Admin / Manager Redirects */}
              <Route path="/admin" element={<ControlGuard><ControlDashboard /></ControlGuard>} />
              <Route path="/manager" element={<ControlGuard><ControlDashboard /></ControlGuard>} />

              {/* PickPal Control — Operations & Management Portal Routes */}
              <Route path="/control/login" element={<ControlLogin />} />
              <Route path="/control" element={<ControlGuard><ControlDashboard /></ControlGuard>} />
              <Route path="/control/workers/applications" element={<ControlGuard><ControlWorkerApplications /></ControlGuard>} />
              <Route path="/control/workers" element={<ControlGuard><ControlWorkers /></ControlGuard>} />
              <Route path="/control/customers" element={<ControlGuard><ControlCustomers /></ControlGuard>} />
              <Route path="/control/orders" element={<ControlGuard><ControlOrders /></ControlGuard>} />
              <Route path="/control/shops" element={<ControlGuard><ControlShops /></ControlGuard>} />
              <Route path="/control/services" element={<ControlGuard><ControlServices /></ControlGuard>} />
              <Route path="/control/queue" element={<ControlGuard><ControlQueue /></ControlGuard>} />
              <Route path="/control/payments" element={<ControlGuard><ControlPayments /></ControlGuard>} />
              <Route path="/control/complaints" element={<ControlGuard><ControlComplaints /></ControlGuard>} />
              <Route path="/control/sos" element={<ControlGuard><ControlSos /></ControlGuard>} />
              <Route path="/control/notifications" element={<ControlGuard><ControlNotifications /></ControlGuard>} />
              <Route path="/control/reports" element={<ControlGuard><ControlReports /></ControlGuard>} />
              <Route path="/control/logs" element={<ControlGuard><ControlLogs /></ControlGuard>} />
              <Route path="/control/settings" element={<ControlGuard><ControlSettings /></ControlGuard>} />

              {/* Root & Fallback Redirects */}
              <Route path="/" element={<MobileAppView />} />
              <Route path="*" element={<MobileAppView />} />
            </Routes>
          </BrowserRouter>
        </ServicesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
