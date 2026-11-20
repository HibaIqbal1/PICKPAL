import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, IndianRupee, Clock, Settings, User, LogOut, Sun, Moon,
  MapPin, Power, Menu, X, ChevronLeft, ChevronRight, Store, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface LayoutProps { children: React.ReactNode; }

const BASE_TABS = [
  { path: "/worker",              label: "Dashboard",    icon: LayoutDashboard },
  { path: "/worker/jobs",         label: "Jobs",         icon: Briefcase },
  { path: "/worker/earnings",     label: "Earnings",     icon: IndianRupee },
  { path: "/worker/availability", label: "Availability", icon: Clock },
  { path: "/worker/services",     label: "Services",     icon: Settings },
  { path: "/worker/inbox",        label: "Messages",     icon: MessageSquare },
  { path: "/worker/profile",      label: "Profile",      icon: User },
];

export default function WorkerLayout({ children }: LayoutProps) {
  const { profile, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode,  setDarkMode]  = useState(() => localStorage.getItem("theme") === "dark");
  const [isOnline,  setIsOnline]  = useState(profile?.isAvailable ?? false);
  const [toggling,  setToggling]  = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    return false;
  });
  const tabs = React.useMemo(() => {
    if (profile?.workerType === "shop_service") {
      const copy = [...BASE_TABS];
      copy.splice(2, 0, { path: "/worker/shop-dashboard", label: "My Shop", icon: Store });
      return copy;
    }
    return BASE_TABS;
  }, [profile?.workerType]);

  useEffect(() => {
    if (profile?.isAvailable !== undefined) setIsOnline(profile.isAvailable);
  }, [profile?.isAvailable]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleAvailability = async () => {
    if (!profile || toggling) return;
    setToggling(true);
    const next = !isOnline;
    setIsOnline(next);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        isAvailable: next, updatedAt: new Date().toISOString(),
      });
    } catch (err) { console.error(err); }
    finally { setToggling(false); }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : "W";

  return (
    <div className="min-h-screen bg-mesh-worker text-ink dark:text-zinc-100 flex transition-colors duration-300">

      {/* ── Desktop / Tablet Collapsible Sidebar ─────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 z-30 glass-sidebar border-r border-[#D8DCE6]/75 dark:border-white/10 transition-all duration-300 ease-in-out flex-shrink-0 ${
          isCollapsed ? "w-[78px]" : "w-[260px]"
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-[#D8DCE6]/75 dark:border-white/10 relative flex items-center justify-between min-h-[73px]">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
            >
              <span className="text-2xl font-display font-extrabold gradient-text-indigo">PickPal</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                Worker
              </span>
            </motion.div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-550 to-indigo-750 flex items-center justify-center text-white font-display font-black text-sm shadow-sm">P</span>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center shadow-md hover:scale-105 transition-transform z-40 text-ink dark:text-zinc-300"
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Location Display */}
        {!isCollapsed && profile?.area && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 border-b border-black/5 dark:border-white/5 overflow-hidden whitespace-nowrap"
          >
            <p className="text-[11px] text-ink-soft dark:text-zinc-400 flex items-center gap-1.5">
              <MapPin size={11} className="text-indigo-500 shrink-0" />
              <span className="truncate">{profile.area}</span>
            </p>
          </motion.div>
        )}

        {/* Navigation - Centered vertically */}
        <nav className="flex-1 flex flex-col justify-center px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                title={isCollapsed ? tab.label : undefined}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden ${
                  active
                    ? "nav-active-worker shadow-sm"
                    : "text-ink-soft dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink dark:hover:text-zinc-100"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="shrink-0"
                >
                  <tab.icon
                    size={19}
                    className={active ? "text-indigo-500" : "text-ink-soft dark:text-zinc-400 group-hover:text-ink dark:group-hover:text-zinc-100 transition-colors"}
                  />
                </motion.div>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {tab.label}
                  </motion.span>
                )}
                {active && !isCollapsed && (
                  <motion.div
                    layoutId="worker-nav-indicator"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 space-y-2">
          {/* Online status */}
          {profile?.verified && (
            <motion.button
              onClick={toggleAvailability}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center justify-between rounded-2xl text-xs font-bold transition-all duration-300 mb-2 border ${
                isOnline
                  ? "bg-success-50 dark:bg-success-600/10 border-success-600/20 text-success-700 dark:text-success-600"
                  : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-ink-soft dark:text-zinc-400"
              } ${isCollapsed ? "p-2.5 justify-center" : "px-4 py-3"}`}
            >
              <span className="flex items-center gap-2">
                <Power size={13} />
                {!isCollapsed && (isOnline ? "Online & Ready" : "Go Online")}
              </span>
              <div className="relative">
                {isOnline && (
                  <span className="absolute inset-0 rounded-full bg-success-600 animate-ping opacity-40" />
                )}
                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-success-600" : "bg-ink-muted"}`} />
              </div>
            </motion.button>
          )}

          {/* User profile details */}
          {profile && (
            <div className={`flex items-center gap-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/15 mb-2 transition-all ${
              isCollapsed ? "p-1.5 justify-center" : "p-3"
            }`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
                {initials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink dark:text-zinc-100 truncate">{profile.name}</p>
                  <p className="text-[10px] text-ink-soft dark:text-zinc-400 truncate">{profile.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={isCollapsed ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
            className={`w-full flex items-center justify-between rounded-xl text-xs font-semibold text-ink-soft dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
              isCollapsed ? "p-2.5 justify-center" : "px-4 py-2.5"
            }`}
          >
            <span className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={darkMode ? "sun" : "moon"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                </motion.span>
              </AnimatePresence>
              {!isCollapsed && (darkMode ? "Light Theme" : "Dark Theme")}
            </span>
            {!isCollapsed && (
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${darkMode ? "bg-indigo-500" : "bg-black/15"}`}>
                <motion.div
                  animate={{ x: darkMode ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${
              isCollapsed ? "p-2.5 justify-center" : "px-4 py-2.5"
            }`}
          >
            <LogOut size={14} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden glass border-b border-black/5 dark:border-white/10 px-4 py-3.5 fixed top-0 left-0 right-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-extrabold gradient-text-indigo">PickPal</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              Worker
            </span>
          </div>
          <div className="flex items-center gap-2">
            {profile?.verified && (
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1 rounded-full border transition-all ${
                isOnline
                  ? "bg-success-50 dark:bg-success-600/10 border-success-600/25 text-success-700 dark:text-success-600"
                  : "bg-black/5 dark:bg-white/8 border-black/10 dark:border-white/10 text-ink-soft dark:text-zinc-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-success-600 animate-pulse" : "bg-ink-muted"}`} />
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDrawerOpen(true)}
              className="w-8 h-8 rounded-full text-ink-soft dark:text-zinc-400 bg-black/5 dark:bg-white/8 flex items-center justify-center"
              aria-label="Open menu drawer"
            >
              <Menu size={16} />
            </motion.button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 pt-16 md:pt-6 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-black/5 dark:border-white/10 z-40 flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <Link key={tab.path} to={tab.path} className="flex flex-col items-center gap-0.5 px-3 py-1 relative">
                {active && (
                  <motion.div
                    layoutId="worker-tab-bg"
                    className="absolute inset-0 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15"
                  />
                )}
                <motion.div
                  animate={{ scale: active ? 1.15 : 1, y: active ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="relative z-10"
                >
                  <tab.icon size={20} className={active ? "text-indigo-500" : "text-ink-soft dark:text-zinc-500"} />
                </motion.div>
                <span className={`text-[10px] font-semibold relative z-10 transition-colors ${active ? "text-indigo-500" : "text-ink-soft dark:text-zinc-500"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Mobile Bottom Drawer Menu ─────────────────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-black/10 dark:border-white/10 rounded-t-[32px] z-50 md:hidden p-6 max-h-[80vh] overflow-y-auto space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-black text-base text-ink dark:text-zinc-100">Worker Options</h3>
                  <p className="text-[10px] text-ink-soft dark:text-zinc-400">Settings & Availability</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User Identity */}
              {profile && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink dark:text-zinc-100 truncate">{profile.name}</p>
                    <p className="text-xs text-ink-soft dark:text-zinc-400 truncate">{profile.email}</p>
                  </div>
                </div>
              )}

              {/* Availability quick switch */}
              {profile?.verified && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/3 dark:bg-white/5 text-sm font-semibold text-ink dark:text-zinc-200">
                  <span className="flex items-center gap-2.5">
                    <Power size={16} className="text-indigo-500" /> Availability Status
                  </span>
                  <button
                    onClick={toggleAvailability}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isOnline
                        ? "bg-success-50 dark:bg-success-600/10 border-success-600/25 text-success-700 dark:text-success-600"
                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-ink-soft"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </button>
                </div>
              )}

              {/* Settings list */}
              <div className="space-y-2">
                <button
                  onClick={() => { setIsDrawerOpen(false); navigate("/worker/profile"); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-black/3 dark:bg-white/5 hover:bg-black/5 text-sm font-semibold text-ink dark:text-zinc-200"
                >
                  <span className="flex items-center gap-2.5">
                    <User size={16} className="text-indigo-500" /> View Profile & Details
                  </span>
                  <ChevronRight size={14} className="text-ink-soft" />
                </button>

                {/* Dark Mode switcher */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/3 dark:bg-white/5 text-sm font-semibold text-ink dark:text-zinc-200">
                  <span className="flex items-center gap-2.5">
                    {darkMode ? <Sun size={16} className="text-indigo-500" /> : <Moon size={16} className="text-indigo-500" />}
                    Dark Theme
                  </span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${darkMode ? "bg-indigo-500" : "bg-black/15"}`}
                  >
                    <motion.div
                      animate={{ x: darkMode ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              </div>

              {/* Logout button at bottom of Drawer */}
              <button
                onClick={() => { setIsDrawerOpen(false); handleLogout(); }}
                className="w-full py-3.5 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                <LogOut size={15} />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
