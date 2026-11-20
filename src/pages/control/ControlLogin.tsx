import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";

export default function ControlLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithEmail, loginWithGoogle, profile, isAdmin, isManager, firebaseUser } = useAuth();
  const navigate = useNavigate();

  // If already authenticated with manager/admin access, redirect to /control
  React.useEffect(() => {
    if (firebaseUser && profile) {
      if (isAdmin || isManager) {
        navigate("/control", { replace: true });
      } else if (profile.role === "customer") {
        navigate("/customer", { replace: true });
      } else if (profile.role === "worker") {
        navigate("/worker", { replace: true });
      }
    }
  }, [firebaseUser, profile, isAdmin, isManager, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userDoc = await loginWithEmail(email.trim(), password);
      if (userDoc) {
        const role = userDoc.role;
        if (role === "admin" || role === "superAdmin" || role === "manager" || role === "localManager" || role === "regionalManager") {
          navigate("/control", { replace: true });
        } else if (role === "customer") {
          setError("Account is registered as Customer. Access to PickPal Control is restricted.");
        } else if (role === "worker") {
          setError("Account is registered as Worker. Access to PickPal Control is restricted.");
        } else {
          setError("Account does not have Manager or Admin permissions.");
        }
      }
    } catch (err: any) {
      console.error("Control login error:", err);
      const msg = err.message || "Failed to log into PickPal Control.";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Invalid email or password credentials.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const userDoc = await loginWithGoogle("manager");
      if (userDoc) {
        const role = userDoc.role;
        if (role === "admin" || role === "superAdmin" || role === "manager" || role === "localManager" || role === "regionalManager") {
          navigate("/control", { replace: true });
        } else {
          setError(`Google account is registered as ${role}. Access to PickPal Control is restricted.`);
        }
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-white tracking-tight">
              PickPal <span className="text-brand-400">Control</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Operations & Platform Management Portal
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 text-rose-400">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Manager / Admin Email
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl focus-within:border-brand-500 transition-colors">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <input
                type="email"
                required
                placeholder="manager@pickpal.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl focus-within:border-brand-500 transition-colors">
              <Lock size={16} className="text-slate-400 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? "Authenticating..." : "Sign into PickPal Control"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 text-slate-600 text-xs">
          <div className="h-px bg-slate-800 flex-1" />
          <span>OR</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Google SSO button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          Sign in with Manager Google Account
        </button>

        {/* System security note */}
        <div className="pt-2 text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" /> Authorized personnel only
          </p>
          <p>Protected by Firebase Authentication & Role Rules</p>
        </div>
      </div>
    </div>
  );
}
