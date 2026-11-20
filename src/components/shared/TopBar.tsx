import React, { useState } from "react";
import { MapPin, ChevronDown, User as UserIcon, LogOut, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Enhanced TopBar with user icon in top corner.
 * Shows login/signup options for unauthenticated users,
 * and user avatar with dropdown for authenticated users.
 */
export function TopBar({ area = "Bengaluru", title, showBack }: { area?: string; title?: string; showBack?: boolean }) {
  const { profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (profile?.role === "customer" || profile?.role === "worker") {
    return null;
  }

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const handleAdminLogin = () => {
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <>
      {/* Top corner user icon - always visible */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          aria-label="User menu"
        >
          {profile ? (
            <UserIcon size={18} className="text-brand-500" />
          ) : (
            <UserIcon size={18} className="text-ink-soft" />
          )}
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-14 right-0 w-48 bg-white rounded-2xl shadow-xl border border-black/5 py-2"
            >
              {!profile ? (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50 transition-colors border-t border-black/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={`/${profile.role}`}
                    className="block px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm font-medium text-ink hover:bg-brand-50 transition-colors border-t border-black/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-black/5"
                  >
                    Log out
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main header content */}
      <header className="sticky top-0 z-30 glass border-b border-black/5 px-4 sm:px-8 pt-4 pb-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-display font-extrabold text-ink">PickPal</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-mint-100 text-mint-600">
                nearby in ~12 min
              </span>
            </div>
            <button className="flex items-center gap-1 text-sm font-semibold text-ink mt-0.5">
              <MapPin size={14} className="text-brand-500" />
              {area} <ChevronDown size={14} className="text-ink-soft" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-ink-soft">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <UserIcon size={15} color="#E8236B" />
                </div>
                {profile.name.split(" ")[0]}
              </div>
            )}
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center"
            >
              <LogOut size={15} className="text-ink-soft" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}