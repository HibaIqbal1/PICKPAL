import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShieldAlert, Siren, Bell, RefreshCw, UserCheck } from "lucide-react";
import { ControlSidebar } from "./ControlSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { PickPalUser, SosAlert, ComplaintDoc } from "../../types";

interface ControlLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ControlLayout({
  children,
  title = "PickPal Control",
  subtitle = "Operations & Management Portal",
  action,
}: ControlLayoutProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [openSosCount, setOpenSosCount] = useState(0);
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { profile, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Subscribe to pending worker applications count
    const unsubWorkers = FirebaseService.subscribeQuery<PickPalUser>("users", [], (users) => {
      const pending = users.filter(
        (u) =>
          u.role === "worker" &&
          (u.status === "pendingApproval" || u.verificationStatus === "pending" || !u.verified)
      ).length;
      setPendingAppsCount(pending);
    });

    // Subscribe to open SOS alerts count
    const unsubSos = FirebaseService.subscribeQuery<SosAlert>("sos_alerts", [], (alerts) => {
      const open = alerts.filter((a) => a.status === "open").length;
      setOpenSosCount(open);
    });

    // Subscribe to open complaints count
    const unsubComplaints = FirebaseService.subscribeQuery<ComplaintDoc>("complaints", [], (comps) => {
      const open = comps.filter((c) => c.status === "Open" || c.status === "Investigating").length;
      setOpenComplaintsCount(open);
    });

    return () => {
      unsubWorkers();
      unsubSos();
      unsubComplaints();
    };
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans antialiased">
      {/* Desktop Permanent Sidebar */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen">
        <ControlSidebar
          pendingApplicationsCount={pendingAppsCount}
          openSosCount={openSosCount}
          openComplaintsCount={openComplaintsCount}
        />
      </div>

      {/* Mobile Sticky Header */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            aria-label="Open Navigation Drawer"
          >
            <Menu size={20} />
          </button>
          <Link to="/control" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <ShieldAlert size={18} />
            </div>
            <span className="font-display font-extrabold text-base tracking-tight text-white">
              PickPal <span className="text-brand-400">Control</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {openSosCount > 0 && (
            <Link
              to="/control/sos"
              className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 animate-pulse flex items-center gap-1 text-xs font-bold"
            >
              <Siren size={16} />
              <span>{openSosCount}</span>
            </Link>
          )}
          {pendingAppsCount > 0 && (
            <Link
              to="/control/workers/applications"
              className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1 text-xs font-bold"
            >
              <UserCheck size={16} />
              <span>{pendingAppsCount}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full">
            <ControlSidebar
              onItemClick={() => setMobileDrawerOpen(false)}
              pendingApplicationsCount={pendingAppsCount}
              openSosCount={openSosCount}
              openComplaintsCount={openComplaintsCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Control Workspace Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/50 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-display font-black text-white tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Backend Badge */}
            <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>Connected to <strong className="text-slate-100 font-mono">pickpal-cee8f</strong></span>
            </div>

            <button
              onClick={handleManualRefresh}
              className={`p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all ${
                refreshing ? "animate-spin text-brand-400" : ""
              }`}
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </button>

            {action}
          </div>
        </div>

        {/* Mobile Subheader Title */}
        <div className="md:hidden px-4 py-3 bg-slate-900/30 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">{title}</h2>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
          {action}
        </div>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
