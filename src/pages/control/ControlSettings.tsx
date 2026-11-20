import React from "react";
import { Settings, ShieldCheck, User, Mail, Key, CheckCircle2, Database, Lock } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";

export default function ControlSettings() {
  const { profile, firebaseUser, isAdmin, resetPassword } = useAuth();
  const [resetSent, setResetSent] = React.useState(false);

  const handlePasswordReset = async () => {
    if (!firebaseUser?.email) return;
    try {
      await resetPassword(firebaseUser.email);
      setResetSent(true);
      alert("Password reset email sent to " + firebaseUser.email);
    } catch (err: any) {
      alert("Failed to send password reset: " + err.message);
    }
  };

  return (
    <ControlLayout
      title="Portal Control & Account Settings"
      subtitle="Manager profile settings, system connectivity, security parameters and role capability matrix"
    >
      <div className="max-w-4xl space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 font-black text-2xl flex items-center justify-center text-white">
              {profile?.name?.slice(0, 2) || "AD"}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{profile?.name || "Operations Manager"}</h3>
              <p className="text-xs text-slate-400">{profile?.email || firebaseUser?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAdmin ? "Super Admin Role" : "Operations Manager Role"}
                </span>
                <span className="text-xs text-slate-500 font-mono">UID: {firebaseUser?.uid}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Password reset */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-200">
            <Lock size={20} className="text-brand-400" />
            <h3 className="text-base font-extrabold text-white">Security & Access Management</h3>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Manager Password</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Send a secure Firebase Authentication password reset link to {firebaseUser?.email}
              </p>
            </div>
            <button
              onClick={handlePasswordReset}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white border border-slate-700"
            >
              {resetSent ? "Reset Email Sent" : "Reset Password"}
            </button>
          </div>
        </div>

        {/* Firebase Environment Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-200">
            <Database size={20} className="text-emerald-400" />
            <h3 className="text-base font-extrabold text-white">Firebase Project Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-500 font-medium">Project ID:</span>
              <p className="text-white font-mono font-bold mt-0.5">pickpal-cee8f</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-500 font-medium">Authentication Source:</span>
              <p className="text-white font-bold mt-0.5">Firebase Auth SDK (onAuthStateChanged)</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-500 font-medium">Database:</span>
              <p className="text-white font-bold mt-0.5">Cloud Firestore (Realtime snapshot listeners)</p>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-500 font-medium">Security Rules Enforced:</span>
              <p className="text-emerald-400 font-bold mt-0.5">Active (firestore.rules)</p>
            </div>
          </div>
        </div>

        {/* Role Matrix */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-extrabold text-white">Role Capability & Permission Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-extrabold">Capability</th>
                  <th className="p-3 font-extrabold text-center">Manager</th>
                  <th className="p-3 font-extrabold text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-3 font-medium">View Workers & Customers</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Approve / Reject Worker Applications</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Manage Orders & Dispatch</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Manage Shop Queues & Tokens</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Handle Complaints & SOS Alerts</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Create Broadcast Announcements</td>
                  <td className="p-3 text-center text-slate-500">✕</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">View System Audit Logs</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                  <td className="p-3 text-center text-emerald-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ControlLayout>
  );
}
