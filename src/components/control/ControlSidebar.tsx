import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Users,
  ShoppingBag,
  Store,
  Wrench,
  Clock,
  CreditCard,
  MessageSquareWarning,
  Siren,
  Bell,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

interface ControlSidebarProps {
  onItemClick?: () => void;
  pendingApplicationsCount?: number;
  openSosCount?: number;
  openComplaintsCount?: number;
}

export function ControlSidebar({
  onItemClick,
  pendingApplicationsCount = 0,
  openSosCount = 0,
  openComplaintsCount = 0,
}: ControlSidebarProps) {
  const location = useLocation();
  const { profile, logout, isAdmin } = useAuth();

  const navItems: NavItem[] = [
    { label: "Dashboard", path: "/control", icon: LayoutDashboard },
    {
      label: "Worker Applications",
      path: "/control/workers/applications",
      icon: UserCheck,
      badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    { label: "Workers", path: "/control/workers", icon: Briefcase },
    { label: "Customers", path: "/control/customers", icon: Users },
    { label: "Orders", path: "/control/orders", icon: ShoppingBag },
    { label: "Shops", path: "/control/shops", icon: Store },
    { label: "Services", path: "/control/services", icon: Wrench },
    { label: "Shop Queue", path: "/control/queue", icon: Clock },
    { label: "Payments", path: "/control/payments", icon: CreditCard },
    {
      label: "Complaints",
      path: "/control/complaints",
      icon: MessageSquareWarning,
      badge: openComplaintsCount > 0 ? openComplaintsCount : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      label: "SOS Alerts",
      path: "/control/sos",
      icon: Siren,
      badge: openSosCount > 0 ? openSosCount : undefined,
      badgeColor: "bg-red-600 text-white animate-pulse",
    },
    { label: "Notifications", path: "/control/notifications", icon: Bell },
    { label: "Reports", path: "/control/reports", icon: BarChart3 },
    { label: "System Logs", path: "/control/logs", icon: FileText },
    { label: "Settings", path: "/control/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link to="/control" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="font-display font-black text-lg tracking-tight text-white leading-none">
              PickPal <span className="text-brand-400 font-extrabold">Control</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
              Operations & Management
            </p>
          </div>
        </Link>
      </div>

      {/* Role Badge User Card */}
      <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-700 font-bold text-xs flex items-center justify-center text-slate-200 uppercase shrink-0">
          {profile?.name?.slice(0, 2) || "AD"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-100 truncate">{profile?.name || "Operations Manager"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAdmin
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isAdmin ? "Super Admin" : "Manager"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Management Modules
        </p>
        {navItems.map((item) => {
          const isActive =
            item.path === "/control"
              ? location.pathname === "/control"
              : location.pathname.startsWith(item.path);

          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon size={17} className={isActive ? "text-white" : "text-slate-400"} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    item.badgeColor || "bg-slate-700 text-slate-200"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <LogOut size={16} />
            <span>Log out</span>
          </div>
          <ChevronRight size={14} className="text-rose-400/50" />
        </button>
      </div>
    </aside>
  );
}
